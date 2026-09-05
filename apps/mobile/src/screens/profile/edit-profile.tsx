import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/xiv/avatar';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { EmptyState } from '@/components/xiv/empty-state';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { Field } from '@/components/xiv/field';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { interests as interestCatalog, regions } from '@/data/mock';
import {
  pickProfilePhoto,
  removeProfilePhoto,
  uploadProfilePhoto,
  type ProfileMediaError,
} from '@/lib/profile-identity';

function asMediaError(caught: unknown): ProfileMediaError {
  const value = caught as ProfileMediaError;
  return {
    code: value.code ?? 'unknown',
    message: value.message ?? 'Could not update the profile photo.',
    hint: value.hint ?? 'Photo changes use your signed-in session only.',
  };
}

export function EditProfileScreen() {
  const { session, saveIdentity, saveInterests, refresh } = useSession();
  const [fullName, setFullName] = useState(session.displayName);
  const [country, setCountry] = useState(session.country);
  const [title, setTitle] = useState(session.professionalTitle);
  const [company, setCompany] = useState(session.company);
  const [industry, setIndustry] = useState(session.industry);
  const [location, setLocation] = useState(session.location);
  const [expertise, setExpertise] = useState(session.expertise);
  const [selectedInterests, setSelectedInterests] = useState(session.interests);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (id: string) => {
    setSelectedInterests((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const identityError = await saveIdentity({
        full_name: fullName.trim(),
        country: country.trim(),
        professional_title: title.trim(),
        company: company.trim(),
        industry: industry.trim(),
        location: location.trim(),
        expertise: expertise.trim(),
      });
      if (identityError) {
        setError(identityError);
        return;
      }
      const interestError = await saveInterests(selectedInterests);
      if (interestError) {
        setError(interestError);
        return;
      }
      setMessage('Identity saved to your account.');
    } finally {
      setBusy(false);
    }
  };

  const changePhoto = async () => {
    if (photoBusy) return;
    setPhotoBusy(true);
    setError(null);
    setMessage(null);
    try {
      const picked = await pickProfilePhoto();
      if (!picked.ok) {
        if ('error' in picked) setError(`${picked.error.message} ${picked.error.hint}`);
        return;
      }
      await uploadProfilePhoto({ uri: picked.uri, mime: picked.mime });
      await refresh();
      setMessage('Profile photo updated.');
    } catch (caught) {
      const media = asMediaError(caught);
      setError(`${media.message} ${media.hint}`);
    } finally {
      setPhotoBusy(false);
    }
  };

  const clearPhoto = async () => {
    if (photoBusy) return;
    setPhotoBusy(true);
    setError(null);
    setMessage(null);
    try {
      await removeProfilePhoto({ avatar_path: session.avatarPath || null });
      await refresh();
      setMessage('Profile photo removed.');
    } catch (caught) {
      const media = asMediaError(caught);
      setError(`${media.message} ${media.hint}`);
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <ExperienceScreen title="Edit Profile" subtitle="Professional identity on your account." atmosphere="cinematic">
      <PrototypeNotice text="Photo uploads use your authenticated session and a private avatars bucket. Cover images are not live. If the identity migration is not applied, fields stay visible and saves will say so honestly." />

      <SectionHeader kicker="Hero" title="How you appear" />
      <Card variant="hero" style={styles.identity}>
        <Avatar name={session.displayName || session.email} uri={session.avatarUrl || null} size={88} />
        <View style={styles.copy}>
          <XivText variant="title">{session.displayName || 'Name pending'}</XivText>
          <XivText variant="body">
            {title.trim() || session.professionalTitle || 'Professional title not saved yet'}
          </XivText>
          <XivText variant="caption" color={Palette.textMuted}>
            {[company.trim() || session.company, industry.trim() || session.industry]
              .filter(Boolean)
              .join(' · ') || 'Company is stored when the identity migration is applied.'}
          </XivText>
          <XivText variant="caption" color={Palette.textDim}>
            JPEG, PNG, or WebP · 2 MB maximum · path {session.userId ? `${session.userId}/…` : 'userId/…'}
          </XivText>
        </View>
      </Card>
      <Button
        label={photoBusy ? 'Updating photo…' : 'Change Photo'}
        variant="secondary"
        disabled={photoBusy}
        onPress={() => void changePhoto()}
      />
      <Button
        label="Remove Photo"
        variant="subtle"
        disabled={photoBusy || !session.avatarPath}
        onPress={() => void clearPhoto()}
      />

      {!session.identitySchemaReady ? (
        <EmptyState
          title="Identity columns are not applied"
          body="Name, email, country, and interests still load from Supabase. Title, company, industry, location, expertise, and avatar_path need supabase/migrations/20260904200000_profile_identity_and_avatars.sql."
          ios="person.crop.circle.badge.exclamationmark"
          android="badge"
        />
      ) : null}

      <SectionHeader kicker="Account" title="Name and region" />
      <Field label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
      <Field label="Email" value={session.email} editable={false} />
      <XivText variant="caption" color={Palette.textDim}>
        Country
      </XivText>
      <View style={styles.wrap}>
        {regions.map((item) => (
          <Chip key={item} label={item} compact selected={country === item} onPress={() => setCountry(item)} />
        ))}
      </View>

      <SectionHeader kicker="Profession" title="How the floor should read you" />
      <Field label="Professional title" value={title} onChangeText={setTitle} placeholder="Director of Operations" />
      <Field label="Company" value={company} onChangeText={setCompany} placeholder="Optional" />
      <Field label="Industry" value={industry} onChangeText={setIndustry} placeholder="Technology" />
      <Field label="Location" value={location} onChangeText={setLocation} placeholder="City or region" />
      <Field
        label="Expertise"
        value={expertise}
        onChangeText={setExpertise}
        placeholder="Supply chain, capital, clinic ops"
      />

      <SectionHeader kicker="Interests" title="Already stored on your account" />
      <View style={styles.wrap}>
        {interestCatalog.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            compact
            selected={selectedInterests.includes(item.id)}
            onPress={() => toggleInterest(item.id)}
          />
        ))}
      </View>

      {error ? <EmptyState title="Could not save" body={error} ios="exclamationmark.triangle" android="warning" /> : null}
      {message ? (
        <Card>
          <XivText variant="label" color={Palette.success}>
            Saved
          </XivText>
          <XivText variant="body" muted>
            {message}
          </XivText>
        </Card>
      ) : null}

      <Button label={busy ? 'Saving…' : 'Save identity'} disabled={busy} onPress={() => void save()} />
    </ExperienceScreen>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
