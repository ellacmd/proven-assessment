import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { EditProfileModal } from './edit-profile-modal/edit-profile-modal';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { EditableUserProfile } from '../../shared/models/user.model';
import { Subject, takeUntil } from 'rxjs';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, TruncatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();
  private timeoutId: number | null = null;

  isLoading = signal(false);
  errorMessage = signal('');

  currentUser = computed(() => this.authService.currentUser());
  isAuthenticated = computed(() => this.authService.isAuthenticated());

  ngOnInit() {
    this.loadUserProfile();

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['edit']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true,
        });

        this.timeoutId = setTimeout(() => {
          this.onEditProfile();
        }, 100);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  async loadUserProfile() {
    const user = this.currentUser();
    if (!user) {
      this.errorMessage.set('User not authenticated');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.refreshUserProfile(user.id);
    } catch (error) {
      console.error('Error loading profile:', error);
      this.errorMessage.set('An error occurred while loading profile');
    } finally {
      this.isLoading.set(false);
    }
  }

  get initials(): string {
    const profile = this.currentUser();
    if (!profile?.username) return 'U';

    return profile.username
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase();
  }

  get hasProfileImage(): boolean {
    const profile = this.currentUser();
    return !!(profile?.avatar_url && profile.avatar_url.trim() !== '');
  }

  onEditProfile(): void {
    const profile = this.currentUser();
    if (!profile) return;

    const dialogRef = this.dialog.open(EditProfileModal, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'no-radius-dialog',
      data: profile,
      disableClose: false,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) return;
      await this.handleProfileUpdate(result);
    });
  }

  private async handleProfileUpdate(result: {
    updatedProfile: Partial<EditableUserProfile>;
    avatarFile?: File | null;
    avatarRemoved?: boolean;
  }) {
    const user = this.currentUser();
    if (!user) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    let hasErrors = false;

    try {
      if (result.avatarRemoved) {
        const del = await this.userService.deleteAvatar(user.id);
        if (!del.success) {
          this.errorMessage.set(del.error || 'Failed to delete avatar');
          hasErrors = true;
        }
      } else if (result.avatarFile) {
        const up = await this.userService.uploadAvatar(user.id, result.avatarFile);
        if (!up.success) {
          this.errorMessage.set(up.error || 'Failed to upload avatar');
          hasErrors = true;
        } else {
          result.updatedProfile = { ...result.updatedProfile, avatar_url: up.url };
        }
      }

      const { username, country, birth_date, website } = result.updatedProfile;
      const hasNonAvatarChanges = [username, country, birth_date, website].some(
        (v) => v !== undefined
      );
      if (hasNonAvatarChanges) {
        const update = await this.userService.updateUserProfile(user.id, result.updatedProfile);
        if (!update.success) {
          this.errorMessage.set(update.error || 'Failed to update profile');
          hasErrors = true;
        }
      }

      await this.authService.refreshUserProfile(user.id);

      if (!hasErrors) {
        this.snackBar.open('Profile updated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-toast'],
        });
      }
    } catch (error) {
      this.errorMessage.set('An error occurred while updating profile');
    } finally {
      this.isLoading.set(false);
    }
  }
}
