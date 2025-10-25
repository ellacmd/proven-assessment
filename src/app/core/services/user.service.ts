import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '../../shared/models/user.model';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private supabaseService: SupabaseService) {}

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      const mapped: User = {
        id: userId,
        email: data.email,
        username: data.username,
        phone: data.phone ?? undefined,
        birth_date: data.birth_date ?? undefined,
        country: data.country ?? undefined,
        website: data.website ?? undefined,
        avatar_url: data.avatar_url ?? undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return mapped;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async updateUserProfile(
    userId: string,
    profileData: Partial<User>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update profile' };
    }
  }

  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await this.supabaseService.client.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data } = this.supabaseService.client.storage.from('avatars').getPublicUrl(filePath);

      const updateResult = await this.updateUserProfile(userId, {
        avatar_url: data.publicUrl,
      });

      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }

      return { success: true, url: data.publicUrl };
    } catch (error) {
      return { success: false, error: 'Failed to upload avatar' };
    }
  }

  async deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: files, error: listError } = await this.supabaseService.client.storage
        .from('avatars')
        .list(userId);

      if (!listError && files && files.length > 0) {
        const paths = files.map((f: any) => `${userId}/${f.name}`);
        await this.supabaseService.client.storage.from('avatars').remove(paths);
      }

      const updateResult = await this.updateUserProfile(userId, {
        avatar_url: null as unknown as any,
      });

      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete avatar' };
    }
  }

  getUserProfileObservable(userId: string): Observable<User | null> {
    return from(this.getUserProfile(userId));
  }
}
