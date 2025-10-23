import { Component, Inject, OnInit } from '@angular/core';
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
import { countries } from '../../../core/utils/constants';

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
  selector: 'app-edit-profile-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  templateUrl: './edit-profile-modal.html',
  styleUrl: './edit-profile-modal.css',
})
export class EditProfileModal implements OnInit {
  editForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  filteredCountries: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditProfileModal>,
    @Inject(MAT_DIALOG_DATA) public data: ProfileData
  ) {
    console.log('EditProfileModal constructor - data:', data);
    console.log('Profile image from data:', data.profileImage);
  }

  ngOnInit() {
    this.initializeForm();
    this.setupCountryFiltering();
    this.loadExistingData();
  }

  initializeForm() {
    this.editForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }],
      phone: [{ value: '', disabled: true }],
      country: ['', Validators.required],
      birthdate: ['', Validators.required],
      website: [''],
    });
  }

  setupCountryFiltering() {
    this.editForm.get('country')?.valueChanges.subscribe((value) => {
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

  loadExistingData() {
    this.editForm.patchValue({
      username: this.data.username,
      email: this.data.email,
      phone: this.data.phone,
      country: this.data.country,
      birthdate: this.data.birthdate,
      website: this.data.website,
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('File size must be less than 1MB');
      
        event.target.value = '';
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
    
      this.selectedFile = null;
    }
  }

  onDeleteImage() {
    console.log('Deleting image, current previewUrl:', this.previewUrl);
    this.previewUrl = null;
    this.selectedFile = null;
   
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    console.log('After deletion, previewUrl:', this.previewUrl);
  }

  onSave() {
    if (this.editForm.valid) {
      const formData = this.editForm.value;
      const updatedProfile = {
        ...formData,
        profileImage: this.previewUrl || this.data.profileImage,
      };
      this.dialogRef.close(updatedProfile);
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
    if (fieldName === 'email' || fieldName === 'phone') {
      return '';
    }

    const field = this.editForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.capitalizeFirstLetter(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
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
