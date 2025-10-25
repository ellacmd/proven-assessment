import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function websiteUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return null;
    }

    const value: string = String(rawValue).trim();
    if (value.length === 0) return null;

    const candidate = /^(https?:)?\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(candidate);
      if (!url.hostname || !/\.[a-z]{2,}$/i.test(url.hostname)) {
        return { invalidUrl: true };
      }
      return null;
    } catch {
      return { invalidUrl: true };
    }
  };
}

export function birthDateValidator(minAgeYears: number = 13): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }

    let date: Date | null = null;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      const parsed = new Date(value);
      date = isNaN(parsed.getTime()) ? null : parsed;
    }

    if (!date) {
      return { invalidDate: true };
    }

    const today = new Date();
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (date > now) {
      return { invalidDate: true };
    }

    const minBirthDate = new Date(now.getFullYear() - minAgeYears, now.getMonth(), now.getDate());
    if (date > minBirthDate) {
      return { tooYoung: true };
    }

    return null;
  };
}

export function phoneNumberValidator(minDigits: number = 10, maxDigits: number = 15): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return null;
    }

    const value: string = String(rawValue).trim();
    if (value.length === 0) return null;

    if (!/^[0-9()\s\-]*$/.test(value)) {
      return { invalidPhone: true };
    }

    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length < minDigits || digitsOnly.length > maxDigits) {
      return { invalidPhone: true };
    }

    return null;
  };
}
