export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  birth_date?: string;
  country?: string;
  website?: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  phone?: string;
  birth_date?: string;
  country?: string;
  website?: string;
  avatar?: File;
}

export interface VerificationData {
  email: string;
  code: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type EditableUserProfile = Pick<
  User,
  'username' | 'birth_date' | 'country' | 'website' | 'avatar_url'
>;

export interface CountryInfo {
  name: string;
  flag: string;
  dialCode: string;
  cca2: string;
}

export interface CountryApiResponse {
  name: {
    common: string;
  };
  flags: {
    svg?: string;
    png?: string;
  };
  idd: {
    root?: string;
    suffixes?: string[];
  };
  cca2: string;
}

export interface SupabaseFile {
  name: string;
}

export interface AuthUserMetadata {
  username?: string;
  phone?: string;
  birth_date?: string;
  country?: string;
  website?: string;
}
