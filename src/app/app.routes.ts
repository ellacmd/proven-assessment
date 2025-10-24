import { Routes } from '@angular/router';
import { SignUp } from './features/sign-up/sign-up';
import { SignIn } from './features/sign-in/sign-in';
import { ProfilePage } from './features/profile/profile';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: SignUp,
  },
  {
    path: 'signin',
    component: SignIn,
  },
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
