import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';

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
export class Navbar {
  drawerOpened = false;

  isSignedIn = true;
  currentUser = {
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    avatar: '/avatar.png',
  };

  constructor(private router: Router) {}

  toggleDrawer() {
    this.drawerOpened = !this.drawerOpened;
  }

  onProfileClick() {
    this.router.navigate(['/profile']);
  }

  onEditProfileClick() {
    console.log('Edit profile clicked');
  }

  onLogoutClick() {
    this.isSignedIn = false;
    console.log('User logged out');
  }
}
