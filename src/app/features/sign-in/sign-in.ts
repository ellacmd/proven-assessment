import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sign-in',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  signInForm!: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  hidePassword = true;

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  async onSignIn() {
    if (this.signInForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      try {
        const { email, password } = this.signInForm.value;
        const result = await this.authService.signIn(email, password);

        if (result.success) {
          this.router.navigate(['/profile']);
        } else {
          this.errorMessage.set(result.error || 'Sign in failed');
        }
      } catch (error) {
        this.errorMessage.set('An unexpected error occurred');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.markFormGroupTouched(this.signInForm);
    }
  }

  onSignUp() {
    this.router.navigate(['/signup']);
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.signInForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.capitalizeFirstLetter(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
    }
    return '';
  }

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
