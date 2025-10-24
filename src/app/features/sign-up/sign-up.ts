import {
  Component,
  OnInit,
  ViewChildren,
  QueryList,
  ElementRef,
  signal,
  computed,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { countries } from '../../core/utils/constants';
import { AuthService } from '../../core/services/auth.service';
import { SignUpData } from '../../shared/models/user.model';

@Component({
  selector: 'app-sign-up',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp implements OnInit {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef>;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registrationForm!: FormGroup;
  verificationForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  timer = signal(0);
  isResendDisabled = computed(() => this.timer() > 0);
  filteredCountries: string[] = [];
  isLoading = signal(false);
  errorMessage = signal('');
  currentStep = signal(0);

  ngOnInit() {
    this.initializeForms();
    this.setupCountryFiltering();
  }

  initializeForms() {
    this.registrationForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        birthDate: ['', Validators.required],
        country: ['', Validators.required],
        phone: ['', Validators.required],
        website: [''],
      },
      { validators: this.passwordMatchValidator }
    );

    this.verificationForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit6: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }

    return null;
  }

  setupCountryFiltering() {
    this.registrationForm.get('country')?.valueChanges.subscribe((value) => {
      if (value && typeof value === 'string') {
        this.filteredCountries = countries.filter((country) =>
          country.toLowerCase().includes(value.toLowerCase())
        );
      } else {
        this.filteredCountries = [...countries];
      }
    });

    this.filteredCountries = [...countries];
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('File size must be less than 1MB');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSave(stepper: any) {
    Object.keys(this.registrationForm.controls).forEach((key) => {
      const control = this.registrationForm.get(key);
      if (control?.errors) {
        console.log(`${key} errors:`, control.errors);
      }
    });

    if (this.registrationForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      try {
        const formData = this.registrationForm.value;
        const signUpData: SignUpData = {
          email: formData.email,
          password: formData.password,
          username: formData.username,
          phone: formData.phone,
          birth_date: formData.birthDate,
          country: formData.country,
          website: formData.website,
          avatar: this.selectedFile || undefined,
        };

        const result = await this.authService.signUp(signUpData);

        if (result.success) {
          stepper.next();
          this.currentStep.set(1);
          this.startTimer(120);
          this.sendVerificationCode();
        } else {
          this.errorMessage.set(result.error || 'Registration failed');
        }
      } catch (error) {
        this.errorMessage.set('An unexpected error occurred');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.markFormGroupTouched(this.registrationForm);
    }
  }

  onBack(stepper: any) {
    stepper.previous();
  }

  async onVerify() {
    if (this.verificationForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      try {
        const code = Object.values(this.verificationForm.value).join('');
        const email = this.registrationForm.get('email')?.value;
        const password = this.registrationForm.get('password')?.value;

        if (email && password) {
          console.log('Mock verification successful for code:', code);
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const signInResult = await this.authService.signIn(email, password);

          if (signInResult.success) {
            this.router.navigate(['/profile']);
          } else {
            this.errorMessage.set(signInResult.error || 'Authentication failed');
          }
        }
      } catch (error) {
        this.errorMessage.set('An unexpected error occurred');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.markFormGroupTouched(this.verificationForm);
    }
  }

  async onResendCode() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const email = this.registrationForm.get('email')?.value;
      if (email) {
        const result = await this.authService.sendVerificationCode(email);

        if (result.success) {
          this.startTimer(120);
          this.sendVerificationCode();
        } else {
          this.errorMessage.set(result.error || 'Failed to send verification code');
        }
      }
    } catch (error) {
      this.errorMessage.set('An unexpected error occurred');
    } finally {
      this.isLoading.set(false);
    }
  }

  startTimer(seconds: number) {
    this.timer.set(seconds);

    const interval = setInterval(() => {
      this.timer.update((current) => {
        const newValue = current - 1;
        if (newValue <= 0) {
          clearInterval(interval);
        }
        return newValue;
      });
    }, 1000);
  }

  async sendVerificationCode() {
    const email = this.registrationForm.get('email')?.value;
    if (email) {
      await this.authService.sendVerificationCode(email);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.capitalizeFirstLetter(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength'])
        return `${this.capitalizeFirstLetter(fieldName)} must be at least 3 characters`;
    }
    return '';
  }

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  onDigitInput(event: any, currentIndex: number): void {
    const value = event.target.value;

    if (!/^\d$/.test(value) && value !== '') {
      event.target.value = '';
      return;
    }

    if (value && currentIndex < 6) {
      this.focusNextInput(currentIndex);
    }
  }

  onDigitKeydown(event: KeyboardEvent, currentIndex: number): void {
    if (event.key === 'Backspace') {
      const currentValue = (event.target as HTMLInputElement).value;
      if (!currentValue && currentIndex > 1) {
        this.focusPreviousInput(currentIndex);
      }
    }

    if (event.key === 'ArrowLeft' && currentIndex > 1) {
      this.focusPreviousInput(currentIndex);
    }
    if (event.key === 'ArrowRight' && currentIndex < 6) {
      this.focusNextInput(currentIndex);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');

    if (pastedData && /^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      this.verificationForm.patchValue({
        digit1: digits[0],
        digit2: digits[1],
        digit3: digits[2],
        digit4: digits[3],
        digit5: digits[4],
        digit6: digits[5],
      });

      this.focusInput(6);
    }
  }

  private focusNextInput(currentIndex: number): void {
    if (currentIndex < 6) {
      this.focusInput(currentIndex + 1);
    }
  }

  private focusPreviousInput(currentIndex: number): void {
    if (currentIndex > 1) {
      this.focusInput(currentIndex - 1);
    }
  }

  private focusInput(index: number): void {
    const inputArray = this.digitInputs.toArray();
    if (inputArray[index - 1]) {
      inputArray[index - 1].nativeElement.focus();
    }
  }

  getVerificationError(): string {
    const digitFields = ['digit1', 'digit2', 'digit3', 'digit4', 'digit5', 'digit6'];
    const hasErrors = digitFields.some((field) => {
      const control = this.verificationForm.get(field);
      return control?.errors && control.touched;
    });

    if (hasErrors) {
      return 'Please enter all 6 digits';
    }

    return '';
  }
}
