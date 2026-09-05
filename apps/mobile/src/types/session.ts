export type RoleId = 'consumer' | 'employee' | 'business_owner' | 'executive' | 'entrepreneur';
export type ExperienceId = RoleId;
export type HomeExperience = 'consumer' | 'employee' | 'business' | 'executive';
export type AuthMode = 'create' | 'signin';

export type SignUpResult =
  | { status: 'authenticated' }
  | { status: 'confirm_email'; email: string }
  | { status: 'error'; message: string };

export type SessionSnapshot = {
  userId: string;
  displayName: string;
  email: string;
  country: string;
  avatarPath: string;
  avatarUrl: string;
  professionalTitle: string;
  company: string;
  industry: string;
  location: string;
  expertise: string;
  identitySchemaReady: boolean;
  interests: string[];
  experience: RoleId | null;
  accountCreated: boolean;
  securityIntroComplete: boolean;
  interestsComplete: boolean;
  experienceSelected: boolean;
  onboardingComplete: boolean;
};
