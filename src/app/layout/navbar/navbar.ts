import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subject, takeUntil, filter } from 'rxjs';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    TruncatePipe,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  drawerOpened = signal(false);
  isOnProfileRoute = signal(false);

  isAuthenticated = computed(() => this.authService.isAuthenticated());
  currentUser = computed(() => this.authService.currentUser());

  ngOnInit() {
    this.authService.refreshUserProfile();

    this.isOnProfileRoute.set(this.router.url.startsWith('/profile'));
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isOnProfileRoute.set(this.router.url.startsWith('/profile'));
      });
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
    if (this.drawerOpened()) {
      this.drawerOpened.set(false);
    }
  }

  onEditProfileClick() {
    const timestamp = Date.now();
    this.router.navigate(['/profile'], { queryParams: { edit: timestamp } });
    if (this.drawerOpened()) {
      this.drawerOpened.set(false);
    }
  }

  async onLogoutClick() {
    try {
      if (this.drawerOpened()) {
        this.drawerOpened.set(false);
      }
      await this.authService.signOut();
    } catch (error) {
      this.router.navigate(['/']);
    }
  }

  onSignInClick() {
    this.router.navigate(['/signin']);
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
