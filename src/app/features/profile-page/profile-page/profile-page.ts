import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ProfileData {
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  birthdate: string;
  website: string;
  profileImage: string;
}

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  profileData: ProfileData = {
    name: 'Robert Downey Jr',
    username: 'Robert Downey Jr',
    email: 'robertdjr@starkindustries.com',
    phone: '+1 123-456-789',
    country: 'United States',
    birthdate: '09/10/1968',
    website: 'www.starkindustries.com',
    profileImage: 'dffdsdf',
  };

  get initials(): string {
    return this.profileData.name
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase();
  }

  get hasProfileImage(): boolean {
    return !!(this.profileData.profileImage && this.profileData.profileImage.trim() !== '');
  }

  onEditProfile(): void {
    console.log('Edit profile clicked');
  }
}
