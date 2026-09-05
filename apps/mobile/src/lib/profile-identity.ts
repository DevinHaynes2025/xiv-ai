import * as ImagePicker from 'expo-image-picker';

import { diagnoseAuthStage } from '@/lib/diagnostics';
import { currentUser, type Profile } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ProfileIdentityPatch = {
  full_name?: string;
  country?: string;
  professional_title?: string;
  company?: string;
  industry?: string;
  location?: string;
  expertise?: string;
};

export type ProfileMediaError = {
  code: string;
  message: string;
  hint: string;
};

function isMissingRelation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === 'PGRST204' ||
    error.code === '42P01' ||
    /could not find/i.test(error.message ?? '') ||
    /schema cache/i.test(error.message ?? '') ||
    /bucket not found/i.test(error.message ?? '')
  );
}

function mediaError(error: { code?: string; message?: string }, fallback: string): ProfileMediaError {
  const code = error.code ?? 'unknown';
  const message = error.message ?? fallback;
  if (isMissingRelation(error)) {
    return {
      code,
      message,
      hint: "Run supabase/migrations/20260904200000_profile_identity_and_avatars.sql in the Supabase SQL editor, then NOTIFY pgrst, 'reload schema';",
    };
  }
  return {
    code,
    message,
    hint: 'Profile photo uses the signed-in session only. No service-role key is used.',
  };
}

function extensionForMime(mime: string) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function mimeFromAsset(asset: ImagePicker.ImagePickerAsset) {
  const mime = asset.mimeType?.toLowerCase();
  if (mime && (AVATAR_MIME_TYPES as readonly string[]).includes(mime)) return mime;
  const name = (asset.fileName ?? asset.uri).toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return null;
}

export async function resolveAvatarUrl(path: string | null | undefined) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) {
    diagnoseAuthStage('profile:avatar_sign_failed', error.message);
    return null;
  }
  return data.signedUrl;
}

export async function saveProfileIdentity(patch: ProfileIdentityPatch) {
  const user = await currentUser();
  const identity = await supabase
    .from('profiles')
    .update({
      full_name: patch.full_name,
      country: patch.country,
      professional_title: patch.professional_title,
      company: patch.company,
      industry: patch.industry,
      location: patch.location,
      expertise: patch.expertise,
    })
    .eq('id', user.id);

  if (!identity.error) return;

  if (isMissingRelation(identity.error)) {
    diagnoseAuthStage('profile:identity_save_fallback', identity.error.code, identity.error.message);
    const base = await supabase
      .from('profiles')
      .update({
        full_name: patch.full_name,
        country: patch.country,
      })
      .eq('id', user.id);
    if (base.error) {
      diagnoseAuthStage('profile:identity_save_failed', base.error.code, base.error.message);
      throw mediaError(base.error, 'Could not save name and country.');
    }
    throw mediaError(
      identity.error,
      'Name and country saved. Title, company, industry, location, and expertise need the identity migration.',
    );
  }

  diagnoseAuthStage('profile:identity_save_failed', identity.error.code, identity.error.message);
  throw mediaError(identity.error, 'Could not save professional identity.');
}

export async function pickProfilePhoto(): Promise<
  { ok: true; uri: string; mime: string; fileSize: number | null } | { ok: false; cancelled: true } | { ok: false; error: ProfileMediaError }
> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return {
      ok: false,
      error: {
        code: 'permission_denied',
        message: 'Photo library access was not granted.',
        hint: 'Allow photos so you can set a profile picture. XIV does not upload until you confirm Change Photo.',
      },
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  const asset = result.assets[0];
  const mime = mimeFromAsset(asset);
  if (!mime) {
    return {
      ok: false,
      error: {
        code: 'invalid_mime',
        message: 'Use a JPEG, PNG, or WebP image.',
        hint: 'Other formats are rejected before upload.',
      },
    };
  }

  if (typeof asset.fileSize === 'number' && asset.fileSize > AVATAR_MAX_BYTES) {
    return {
      ok: false,
      error: {
        code: 'file_too_large',
        message: 'Choose an image under 2 MB.',
        hint: 'The avatars bucket rejects larger files.',
      },
    };
  }

  return { ok: true, uri: asset.uri, mime, fileSize: asset.fileSize ?? null };
}

export async function uploadProfilePhoto(input: { uri: string; mime: string }) {
  const user = await currentUser();
  const response = await fetch(input.uri);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > AVATAR_MAX_BYTES) {
    throw {
      code: 'file_too_large',
      message: 'Choose an image under 2 MB.',
      hint: 'The avatars bucket rejects larger files.',
    } satisfies ProfileMediaError;
  }

  const ext = extensionForMime(input.mime);
  const path = `${user.id}/avatar.${ext}`;
  if (!path.startsWith(`${user.id}/`)) {
    throw {
      code: 'path_rejected',
      message: 'Photo path must stay under your account folder.',
      hint: 'Profile photos are stored as {userId}/avatar.* only.',
    } satisfies ProfileMediaError;
  }
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, bytes, {
    contentType: input.mime,
    upsert: true,
  });

  if (error) {
    diagnoseAuthStage('profile:avatar_upload_failed', error.message);
    throw mediaError(error, 'Could not upload the profile photo.');
  }

  const { error: profileError } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', user.id);
  if (profileError) {
    diagnoseAuthStage('profile:avatar_path_failed', profileError.code, profileError.message);
    throw mediaError(profileError, 'Photo uploaded, but the profile path could not be saved.');
  }

  return path;
}

export async function removeProfilePhoto(profile: Pick<Profile, 'avatar_path'> | null) {
  const user = await currentUser();
  if (profile?.avatar_path && !profile.avatar_path.startsWith(`${user.id}/`)) {
    throw {
      code: 'path_rejected',
      message: 'That photo path does not belong to this account.',
      hint: 'Only your own avatar object can be removed.',
    } satisfies ProfileMediaError;
  }
  if (profile?.avatar_path) {
    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([profile.avatar_path]);
    if (error && !/not found/i.test(error.message)) {
      diagnoseAuthStage('profile:avatar_remove_failed', error.message);
      throw mediaError(error, 'Could not remove the stored photo.');
    }
  }

  const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('id', user.id);
  if (error) {
    diagnoseAuthStage('profile:avatar_clear_failed', error.code, error.message);
    throw mediaError(error, 'Could not clear the profile photo path.');
  }
}
