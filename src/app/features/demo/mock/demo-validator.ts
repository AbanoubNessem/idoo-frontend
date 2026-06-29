import { Injectable } from '@angular/core';
import { FormFieldValidator, ValidatorSpec } from '../../../core/platform/forms/form.types';

@Injectable()
export class DemoValidator implements FormFieldValidator {

  async validate(
    value: unknown,
    validators: ValidatorSpec[],
    _context: Record<string, unknown>,
  ): Promise<string[]> {
    const errors: string[] = [];

    for (const v of validators) {
      const msg = this._check(value, v);
      if (msg) errors.push(msg);
    }

    return errors;
  }

  private _check(value: unknown, spec: ValidatorSpec): string | null {
    const msg = spec.message;

    switch (spec.type) {
      case 'required':
        if (value === null || value === undefined || value === '' ||
            (Array.isArray(value) && value.length === 0)) {
          return msg ?? 'This field is required';
        }
        break;

      case 'email': {
        const s = String(value ?? '').trim();
        if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
          return msg ?? 'Enter a valid email address';
        }
        break;
      }

      case 'phone': {
        const s = String(value ?? '').trim();
        if (s && !/^[\d\s\+\-\(\)\.]{6,20}$/.test(s)) {
          return msg ?? 'Enter a valid phone number';
        }
        break;
      }

      case 'minLength': {
        const min = (spec.params?.['min'] as number) ?? 0;
        const s   = String(value ?? '');
        if (s && s.length < min) {
          return msg ?? `Minimum ${min} characters required`;
        }
        break;
      }

      case 'maxLength': {
        const max = (spec.params?.['max'] as number) ?? Infinity;
        const s   = String(value ?? '');
        if (s.length > max) {
          return msg ?? `Maximum ${max} characters allowed`;
        }
        break;
      }

      case 'pattern': {
        const pattern = spec.params?.['pattern'] as string;
        if (pattern && value) {
          const re = new RegExp(pattern);
          if (!re.test(String(value))) {
            return msg ?? 'Value does not match required format';
          }
        }
        break;
      }

      case 'min': {
        const min = spec.params?.['min'] as number;
        if (min !== undefined && Number(value) < min) {
          return msg ?? `Value must be at least ${min}`;
        }
        break;
      }

      case 'max': {
        const max = spec.params?.['max'] as number;
        if (max !== undefined && Number(value) > max) {
          return msg ?? `Value must be at most ${max}`;
        }
        break;
      }
    }

    return null;
  }
}
