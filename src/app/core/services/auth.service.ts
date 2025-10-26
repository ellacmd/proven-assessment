import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User, SignUpData, AuthUserMetadata } from '../../shared/models/user.model';
import type { Subscription } from '@supabase/auth-js';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private readonly STORAGE_KEY = 'auth_user';
  private authStateChangeSubscription: { data: { subscription: Subscription } } | null = null;

  private userSignal = signal<User | null>(this.getUserFromStorage());

  isAuthenticated = computed(() => !!this.userSignal());
  currentUser = computed(() => this.userSignal());

  constructor(private supabaseService: SupabaseService, private router: Router) {
    this.initializeAuth();
  }

  private async initializeAuth() {
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
    }

    this.authStateChangeSubscription = this.supabaseService.client.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.clearUser();
        }
      }
    );
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
    try {
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
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Sign up failed' };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
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
    }
  }

  async signOut(): Promise<void> {
    this.clearUser();
    this.router.navigate(['/'], { replaceUrl: true });
    void this.supabaseService.client.auth.signOut().catch((err) => {
      console.error('Error signing out:', err);
    });
  }

  async verifyCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
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
      const user = await this.getUserProfile(userId);
      if (user) {
        this.setUser(user);
        return;
      }

      const fallbackUser = await this.createFallbackUser(userId);
      if (fallbackUser) {
        this.setUser(fallbackUser);
        await this.createUserProfileFromFallback(userId, fallbackUser);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  }

  private async getUserProfile(userId: string): Promise<User | null> {
    const { data: profiles, error } = await this.supabaseService.client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return this.mapProfileToUser(profiles, userId);
  }

  private async createFallbackUser(userId: string): Promise<User | null> {
    const { data: userResp } = await this.supabaseService.client.auth.getUser();
    const authUser = userResp?.user;

    if (!authUser) return null;

    const meta: AuthUserMetadata =
      (authUser as { user_metadata?: AuthUserMetadata }).user_metadata || {};

    return {
      id: userId,
      email: authUser.email || '',
      username: meta.username || authUser.email || 'User',
      phone: meta.phone,
      birth_date: meta.birth_date,
      country: meta.country,
      website: meta.website,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private mapProfileToUser(profile: User, userId: string): User {
    return {
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
  }

  private async createUserProfileFromFallback(userId: string, user: User): Promise<void> {
    try {
      await this.createUserProfile(userId, {
        email: user.email,
        password: '',
        username: user.username,
        phone: user.phone,
        birth_date: user.birth_date,
        country: user.country,
        website: user.website,
        avatar: undefined,
      });
    } catch (error) {
      console.error('Failed to create user profile:', error);
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

  private setUser(user: User): void {
    this.userSignal.set(user);
    this.saveUserToStorage(user);
  }

  private clearUser(): void {
    this.userSignal.set(null);
    this.saveUserToStorage(null);
  }

  ngOnDestroy() {
    if (this.authStateChangeSubscription) {
      this.authStateChangeSubscription.data.subscription.unsubscribe();
      this.authStateChangeSubscription = null;
    }
  }
}
