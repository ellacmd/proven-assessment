import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models/user.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  drawerOpened = signal(false);

  // Authentication state
  isAuthenticated = computed(() => this.authService.isAuthenticated());
  currentUser = computed(() => this.authService.currentUser());
  isLoading = computed(() => this.authService.isLoading$);

  ngOnInit() {
    // Subscribe to auth state changes
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDrawer() {
    this.drawerOpened.update((value) => !value);
  }

  onProfileClick() {
    this.router.navigate(['/profile']);
    // Close drawer if it's open (for mobile)
    if (this.drawerOpened()) {
      this.drawerOpened.set(false);
    }
  }

  onEditProfileClick() {
    // Use a timestamp to ensure the query parameter changes each time
    const timestamp = Date.now();
    this.router.navigate(['/profile'], { queryParams: { edit: timestamp } });
    // Close drawer if it's open (for mobile)
    if (this.drawerOpened()) {
      this.drawerOpened.set(false);
    }
  }

  async onLogoutClick() {
    try {
      console.log('Logging out user...');
      // Close drawer if it's open (for mobile)
      if (this.drawerOpened()) {
        this.drawerOpened.set(false);
      }
      await this.authService.signOut();
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force navigation to home page even if logout fails
      this.router.navigate(['/']);
    }
  }

  onSignInClick() {
    this.router.navigate(['/signin']);
  }

  onRegistrationClick() {
    this.router.navigate(['/']);
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user?.username) return 'U';

    return user.username
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase();
  }
}
