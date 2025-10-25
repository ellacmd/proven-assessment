import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EditableUserProfile } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private supabaseService: SupabaseService) {}

  async updateUserProfile(
    userId: string,
    profileData: Partial<EditableUserProfile>
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

      const updateResult = await this.updateUserProfile(userId, { avatar_url: data.publicUrl });

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

      const updateResult = await this.updateUserProfile(userId, { avatar_url: null });

      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete avatar' };
    }
  }
}
