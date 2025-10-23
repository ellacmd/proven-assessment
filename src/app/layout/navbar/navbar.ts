import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, MatButtonModule, MatSidenavModule, MatListModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  drawerOpened = false;

  toggleDrawer() {
    this.drawerOpened = !this.drawerOpened;
  }
}
