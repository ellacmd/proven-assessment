import { Routes } from '@angular/router';
import { SignUp } from './features/sign-up/sign-up';
import { ProfilePage } from './features/profile/profile';

export const routes: Routes = [
  {
    path: '',
    component: SignUp,
  },
  {
    path: 'profile',
    component: ProfilePage,
  },
];
