export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  birth_date?: string;
  country?: string;
  website?: string;
  avatar_url?: string;
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
