import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { EditProfileModal } from './edit-profile-modal/edit-profile-modal';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User, UserProfile } from '../../shared/models/user.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  profileData = signal<UserProfile | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  // Computed properties
  currentUser = computed(() => this.authService.currentUser());
  isAuthenticated = computed(() => this.authService.isAuthenticated());

  ngOnInit() {
    this.loadUserProfile();

    // Subscribe to query parameter changes
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['edit']) {
        // Small delay to ensure profile is loaded
        setTimeout(() => {
          this.onEditProfile();
        }, 100);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadUserProfile() {
    const user = this.currentUser();
    if (!user) {
      this.errorMessage.set('User not authenticated');
      this.isLoading.set(false);
      return;
    }

    console.log('Loading profile for user:', user.id);
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const profile = await this.userService.getUserProfile(user.id);
      if (profile) {
        console.log('Profile loaded successfully:', profile);
        this.profileData.set(profile);
      } else {
        console.log('No profile found, creating basic profile data');
        // Create a basic profile from user data
        const basicProfile = {
          id: user.id,
          user_id: user.id,
          username: user.username || 'User',
          email: user.email || '',
          phone: user.phone || '',
          birth_date: user.birth_date || '',
          country: user.country || '',
          website: user.website || '',
          avatar_url: user.avatar_url || '',
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
        };
        this.profileData.set(basicProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.errorMessage.set('An error occurred while loading profile');
    } finally {
      this.isLoading.set(false);
    }
  }

  get initials(): string {
    const profile = this.profileData();
    if (!profile?.username) return 'U';

    return profile.username
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase();
  }

  get hasProfileImage(): boolean {
    const profile = this.profileData();
    return !!(profile?.avatar_url && profile.avatar_url.trim() !== '');
  }

  onEditProfile(): void {
    const profile = this.profileData();
    if (!profile) return;

    const dialogRef = this.dialog.open(EditProfileModal, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: profile,
      disableClose: false,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.updateProfile(result);
      }
    });
  }

  async updateProfile(updatedData: Partial<UserProfile>) {
    const user = this.currentUser();
    if (!user) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const result = await this.userService.updateUserProfile(user.id, updatedData);

      if (result.success) {
        // Reload profile data
        await this.loadUserProfile();
      } else {
        this.errorMessage.set(result.error || 'Failed to update profile');
      }
    } catch (error) {
      this.errorMessage.set('An error occurred while updating profile');
    } finally {
      this.isLoading.set(false);
    }
  }
}
