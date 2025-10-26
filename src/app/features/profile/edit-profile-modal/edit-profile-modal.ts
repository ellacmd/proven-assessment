import { Component, Inject, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/services/auth.service';
import { User, CountryInfo, CountryApiResponse } from '../../../shared/models/user.model';
import { birthDateValidator, websiteUrlValidator } from '../../../core/utils/validators';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-edit-profile-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
  ],
  providers: [],
  templateUrl: './edit-profile-modal.html',
  styleUrl: './edit-profile-modal.css',
})
export class EditProfileModal implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  editForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  fileError = '';
  countries: CountryInfo[] = [];
  filteredCountries: CountryInfo[] = [];
  avatarRemoved = false;
  private originalUser: User | null = null;
  today: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditProfileModal>,
    @Inject(MAT_DIALOG_DATA) public data: User
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.setupCountryFiltering();
    this.loadExistingData();
    this.loadCountries();
  }

  initializeForm() {
    this.editForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }],
      phone: [{ value: '', disabled: true }],
      country: ['', Validators.required],
      birthdate: ['', [Validators.required, birthDateValidator()]],
      website: ['', websiteUrlValidator()],
    });
  }

  setupCountryFiltering() {
    this.filteredCountries = [...this.countries];
  }

  loadCountries() {
    this.http
      .get<CountryApiResponse[]>('https://restcountries.com/v3.1/all?fields=name,flags,idd,cca2')
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
          this.cdr.markForCheck();
        },
        error: () => {
          this.countries = [];
          this.filteredCountries = [];
        },
      });
  }

  loadExistingData() {
    this.originalUser = this.authService.currentUser() || this.data;

    this.editForm.patchValue({
      username: this.originalUser?.username || '',
      email: this.originalUser?.email || '',
      phone: this.originalUser?.phone || '',
      country: this.originalUser?.country || '',
      birthdate: this.originalUser?.birth_date || '',
      website: this.originalUser?.website || '',
    });

    if (this.originalUser?.avatar_url) {
      this.previewUrl = this.originalUser.avatar_url;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileError = '';

      if (file.size > 1024 * 1024) {
        this.fileError = 'File size must be less than 1MB';
        input.value = '';
        return;
      }

      const allowedTypes = ['image/svg+xml', 'image/jpeg', 'image/jpg', 'image/png'];
      const fileType = file.type.toLowerCase();

      if (!allowedTypes.includes(fileType)) {
        this.fileError = 'Only SVG, JPG, and PNG files are allowed';
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.avatarRemoved = false;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previewUrl = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
    }
  }

  onDeleteImage() {
    this.previewUrl = null;
    this.selectedFile = null;
    this.avatarRemoved = true;

    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSave() {
    if (this.editForm.valid) {
      const formData = this.editForm.value;
      const updatedProfile: Partial<User> = {};

      if ((formData.username || '') !== (this.originalUser?.username || '')) {
        updatedProfile.username = formData.username || '';
      }
      if ((formData.country || '') !== (this.originalUser?.country || '')) {
        updatedProfile.country = formData.country || '';
      }
      if ((formData.birthdate || '') !== (this.originalUser?.birth_date || '')) {
        updatedProfile.birth_date = formData.birthdate || '';
      }
      if ((formData.website || '') !== (this.originalUser?.website || '')) {
        updatedProfile.website = formData.website || '';
      }

      this.dialogRef.close({
        updatedProfile,
        avatarFile: this.selectedFile,
        avatarRemoved: this.avatarRemoved,
      });
    } else {
      this.markFormGroupTouched(this.editForm);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    if (fieldName === 'email') {
      return '';
    }

    const field = this.editForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.capitalizeFirstLetter(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['pattern'] && fieldName === 'phone')
        return 'Enter a valid phone number (digits and dashes only)';
      if (field.errors['invalidUrl']) return 'Enter a valid website url';
      if (field.errors['invalidDate']) return 'Please enter a valid date of birth';
      if (field.errors['minlength'])
        return `${this.capitalizeFirstLetter(fieldName)} must be at least ${
          field.errors['minlength'].requiredLength
        } characters`;
    }
    return '';
  }

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  hasImage(): boolean {
    if (!this.previewUrl || this.previewUrl.trim() === '') {
      return false;
    }
    return true;
  }
}
