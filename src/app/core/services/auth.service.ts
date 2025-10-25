import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User, SignUpData } from '../../shared/models/user.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_user';
  private userSubject = new BehaviorSubject<User | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  private userSignal = signal<User | null>(this.getUserFromStorage());
  private isLoadingSignal = signal<boolean>(false);
  private isInitializedSignal = signal<boolean>(false);

  isAuthenticated = computed(() => !!this.userSignal());
  currentUser = computed(() => this.userSignal());
  isInitialized = computed(() => this.isInitializedSignal());

  user$ = this.userSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private supabaseService: SupabaseService, private router: Router) {
    this.initializeAuth();
  }

  private async initializeAuth() {
    this.setLoading(true);

    try {
      const {
        data: { session },
      } = await this.supabaseService.client.auth.getSession();

      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      } else {
        this.clearUser();
      }
    } catch (error) {
      console.error('AuthService: Error initializing auth:', error);
      this.clearUser();
    } finally {
      this.setLoading(false);
      this.isInitializedSignal.set(true);
    }

    this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.clearUser();
      }
    });
  }

  private getUserFromStorage(): User | null {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  private saveUserToStorage(user: User | null): void {
    if (user) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  async signUp(signUpData: SignUpData): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);

    try {
      console.log('AuthService.signUp: start');
      const payload = {
        email: signUpData.email,
        password: '***',
        options: {
          data: {
            username: signUpData.username,
            phone: signUpData.phone,
            birth_date: signUpData.birth_date,
            country: signUpData.country,
            website: signUpData.website,
          },
        },
      } as const;
      console.log('AuthService.signUp: calling supabase.auth.signUp');
      const { data, error } = await this.supabaseService.client.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            username: signUpData.username,
            phone: signUpData.phone,
            birth_date: signUpData.birth_date,
            country: signUpData.country,
            website: signUpData.website,
          },
        },
      });
      console.log('AuthService.signUp: response', { hasData: !!data, hasError: !!error });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('AuthService.signUp: exception', error);
      return { success: false, error: 'Sign up failed' };
    } finally {
      this.setLoading(false);
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);

    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { success: false, error: error.message };

      if (data.user) {
        await this.loadUserProfile(data.user.id);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Sign in failed' };
    } finally {
      this.setLoading(false);
    }
  }

  async signOut(): Promise<void> {
    this.setLoading(true);

    try {
      this.clearUser();
      this.router.navigate(['/'], { replaceUrl: true });
      void this.supabaseService.client.auth.signOut().catch((err) => {
        console.error('Error signing out:', err);
      });
    } finally {
      this.setLoading(false);
    }
  }

  async sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Sending verification code to:', email);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  async verifyCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Verifying code for:', email, 'Code:', code);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (code.length === 6 && /^\d{6}$/.test(code)) {
        return { success: true };
      } else {
        return { success: false, error: 'Invalid verification code' };
      }
    } catch (error) {
      return { success: false, error: 'Verification failed' };
    }
  }

  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const { data: profiles, error } = await this.supabaseService.client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const profile = profiles?.[0];

      if (profile) {
        const user: User = {
          id: userId,
          email: profile.email,
          username: profile.username,
          phone: profile.phone,
          birth_date: profile.birth_date,
          country: profile.country,
          website: profile.website,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        };
        this.setUser(user);
      } else {
        const { data: userResp } = await this.supabaseService.client.auth.getUser();
        const authUser = userResp?.user;
        if (authUser) {
          const meta: Record<string, any> = (authUser as any).user_metadata || {};
          const fallbackUser: User = {
            id: authUser.id,
            email: authUser.email || '',
            username: meta['username'] || authUser.email || 'User',
            phone: meta['phone'] || undefined,
            birth_date: meta['birth_date'] || undefined,
            country: meta['country'] || undefined,
            website: meta['website'] || undefined,
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          this.setUser(fallbackUser);

          try {
            await this.createUserProfile(authUser.id, {
              email: fallbackUser.email,
              password: '',
              username: fallbackUser.username,
              phone: fallbackUser.phone,
              birth_date: fallbackUser.birth_date,
              country: fallbackUser.country,
              website: fallbackUser.website,
              avatar: undefined,
            });
          } catch {}
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async refreshUserProfile(userId?: string): Promise<void> {
    try {
      let id = userId;
      if (!id) {
        const current = this.userSignal();
        if (current?.id) {
          id = current.id;
        } else {
          const {
            data: { session },
          } = await this.supabaseService.client.auth.getSession();
          id = session?.user?.id;
        }
      }
      if (id) {
        await this.loadUserProfile(id);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  }

  private async createUserProfile(userId: string, signUpData: SignUpData): Promise<void> {
    try {
      await this.supabaseService.client.from('user_profiles').upsert(
        {
          user_id: userId,
          username: signUpData.username,
          email: signUpData.email,
          phone: signUpData.phone,
          birth_date: signUpData.birth_date,
          country: signUpData.country,
          website: signUpData.website,
        },
        { onConflict: 'user_id' }
      );
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  private async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await this.supabaseService.client.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }

      const { data } = this.supabaseService.client.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }

  private async updateUserProfileAvatar(userId: string, avatarUrl: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user profile with avatar URL:', error);
      }
    } catch (error) {
      console.error('Error updating user profile with avatar URL:', error);
    }
  }

  private setUser(user: User): void {
    this.userSignal.set(user);
    this.userSubject.next(user);
    this.saveUserToStorage(user);
  }

  private clearUser(): void {
    this.userSignal.set(null);
    this.userSubject.next(null);
    this.saveUserToStorage(null);
  }

  private setLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
    this.isLoadingSubject.next(loading);
  }
}
