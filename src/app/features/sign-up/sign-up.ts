import {
  Component,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  signal,
  inject,
  ChangeDetectorRef,
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
import { AuthService } from '../../core/services/auth.service';
import { SignUpData, CountryInfo, CountryApiResponse } from '../../shared/models/user.model';
import { UserService } from '../../core/services/user.service';
import { birthDateValidator, websiteUrlValidator } from '../../core/utils/validators';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatStepper } from '@angular/material/stepper';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    HttpClientModule,
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
export class SignUp implements OnInit, OnDestroy {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef>;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  registrationForm!: FormGroup;
  verificationForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  timer = signal(120);
  countries: CountryInfo[] = [];
  filteredCountries: CountryInfo[] = [];
  filteredPhoneCountries: CountryInfo[] = [];
  selectedCountry: CountryInfo | null = null;
  selectedPhoneCountry: CountryInfo | null = null;
  isLoading = signal(false);
  errorMessage = signal('');
  currentStep = signal(0);
  today: Date = new Date();
  private timerInterval: number | null = null;

  get maxDate(): Date {
    return new Date();
  }

  ngOnInit() {
    this.initializeForms();
    this.setupCountryFiltering();
    this.loadCountries();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  initializeForms() {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      birthDate: ['', [Validators.required, birthDateValidator()]],
      country: ['', Validators.required],
      phoneDialCode: [''],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9-]+$/)]],
      website: ['', websiteUrlValidator()],
    });

    this.verificationForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit6: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    });
  }

  setupCountryFiltering() {
    this.filteredCountries = [...this.countries];

    this.registrationForm
      .get('phoneDialCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && typeof value === 'string') {
          const lower = value.toLowerCase();
          this.filteredPhoneCountries = this.countriesWithDial.filter(
            (c) => c.name.toLowerCase().includes(lower) || c.dialCode.includes(value)
          );
        } else {
          this.filteredPhoneCountries = [...this.countriesWithDial];
        }
      });
  }

  loadCountries() {
    this.http
      .get<CountryApiResponse[]>('https://restcountries.com/v3.1/all?fields=name,flags,idd,cca2')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const mapped: CountryInfo[] = res
            .map((c) => {
              const root: string | undefined = c?.idd?.root;
              const suffixes: string[] | undefined = c?.idd?.suffixes;
              const dial = root
                ? `${root}${Array.isArray(suffixes) && suffixes.length ? suffixes[0] : ''}`
                : '';
              return {
                name: c?.name?.common ?? '',
                flag: c?.flags?.svg ?? c?.flags?.png ?? '',
                dialCode: dial,
                cca2: c?.cca2 ?? '',
              } as CountryInfo;
            })
            .filter((c: CountryInfo) => !!c.name);

          mapped.sort((a, b) => a.name.localeCompare(b.name));
          this.countries = mapped;
          this.filteredCountries = [...this.countries];
          this.filteredPhoneCountries = [...this.countriesWithDial];

          const defaultCountry = this.countries.find((c) => c.name === 'United States');
          if (defaultCountry) {
            this.selectedCountry = defaultCountry;
            this.selectedPhoneCountry = defaultCountry;
            this.registrationForm.get('phoneDialCode')?.setValue(defaultCountry.dialCode);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.countries = [];
          this.filteredCountries = [];
          this.filteredPhoneCountries = [];
        },
      });
  }

  onCountrySelected(countryName: string) {
    const found = this.countries.find((c) => c.name === countryName) || null;
    this.selectedCountry = found;
  }

  onPhoneCodeSelected(dialCode: string) {
    const found = this.countries.find((c) => c.dialCode === dialCode) || null;
    this.selectedPhoneCountry = found;
    this.registrationForm.get('phoneDialCode')?.setValue(dialCode || '');
  }

  displayDialCode(dialCode: string): string {
    return dialCode || '';
  }

  get countriesWithDial(): CountryInfo[] {
    return this.countries.filter((c) => !!c.dialCode);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('File size must be less than 1MB');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previewUrl = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  async onSave(stepper: MatStepper) {
    if (!this.registrationForm.valid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const formData = this.registrationForm.value;
      const signUpData: SignUpData = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        phone: `${formData.phoneDialCode || ''}${formData.phone || ''}`.trim(),
        birth_date: formData.birthDate,
        country: formData.country,
        website: formData.website,
        avatar: this.selectedFile || undefined,
      };
      const result = await this.authService.signUp(signUpData);
      if (result.success) {
        this.isLoading.set(false);
        stepper.next();
        if (this.selectedFile) {
          const current = this.authService.currentUser();
          const userId = current?.id;
          if (userId) {
            const up = await this.userService.uploadAvatar(userId, this.selectedFile);
            if (!up.success) {
              this.errorMessage.set(up.error || 'Failed to upload avatar');
            }
            await this.authService.refreshUserProfile(userId);
          }
        }
        this.currentStep.set(1);
        this.startTimer(120);
      } else {
        this.errorMessage.set(result.error || 'Sign up failed');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : error && typeof error === 'object' && 'error' in error
          ? (error as { error: string }).error
          : 'Sign up failed';
      this.errorMessage.set(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onVerify() {
    if (this.verificationForm.valid) {
      this.isLoading.set(true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.isLoading.set(false);
      this.router.navigate(['/profile']);
    }
  }

  async onResendCode() {
    this.errorMessage.set('');
    this.startTimer(120);
  }

  startTimer(seconds: number) {
    this.timer.set(seconds);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.timer.update((current) => {
        const newValue = current - 1;
        if (newValue <= 0) {
          if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
          }
        }
        return newValue;
      });
    }, 1000);
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
      if (field.errors['pattern'] && fieldName === 'phone')
        return 'Enter a valid phone number (digits and dashes only)';
      if (field.errors['invalidUrl']) return 'Enter a valid website url';
      if (field.errors['invalidDate']) return 'Please enter a valid date of birth';
      if (field.errors['futureDate']) return 'Birth date cannot be in the future';
      if (field.errors['minlength'])
        return `${this.capitalizeFirstLetter(fieldName)} must be at least 3 characters`;
    }
    return '';
  }

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  onDigitInput(event: Event, currentIndex: number): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    if (!/^\d$/.test(value) && value !== '') {
      target.value = '';
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
