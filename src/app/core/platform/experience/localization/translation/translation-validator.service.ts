import { Injectable } from '@angular/core';
import { TranslationMap, TranslationNamespace, TranslationValidationResult } from './translation.types';
import { PLURAL_KEYS } from './translation.constants';

@Injectable({ providedIn: 'root' })
export class TranslationValidatorService {
  validate(ns: TranslationNamespace): TranslationValidationResult {
    const errors:   string[] = [];
    const warnings: string[] = [];

    if (!ns.namespace?.trim()) errors.push('namespace is required.');
    if (!ns.locale?.trim())    errors.push('locale is required.');
    if (!ns.data || typeof ns.data !== 'object') {
      errors.push('data is required and must be an object.');
      return { valid: false, errors, warnings, keyCount: 0 };
    }

    const keyCount = this._countKeys(ns.data);
    if (keyCount === 0) warnings.push('Translation namespace contains no keys.');

    this._validateMap(ns.data, '', errors, warnings);

    return { valid: errors.length === 0, errors, warnings, keyCount };
  }

  validateMap(data: TranslationMap): TranslationValidationResult {
    const errors:   string[] = [];
    const warnings: string[] = [];
    this._validateMap(data, '', errors, warnings);
    const keyCount = this._countKeys(data);
    return { valid: errors.length === 0, errors, warnings, keyCount };
  }

  isValid(ns: TranslationNamespace): boolean {
    return this.validate(ns).valid;
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _validateMap(
    data:     TranslationMap,
    prefix:   string,
    errors:   string[],
    warnings: string[],
  ): void {
    for (const [key, value] of Object.entries(data)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        if (!value.trim()) warnings.push(`Key "${fullKey}" has an empty string value.`);
        this._checkInterpolation(fullKey, value, warnings);
      } else if (typeof value === 'object' && value !== null) {
        // Check if it's a plural object
        const keys = Object.keys(value);
        const isPluralObj = keys.length > 0 && keys.every(k => PLURAL_KEYS.has(k));
        if (isPluralObj) {
          if (!('other' in value)) {
            errors.push(`Plural key "${fullKey}" must have an "other" form.`);
          }
        } else {
          this._validateMap(value as TranslationMap, fullKey, errors, warnings);
        }
      } else {
        errors.push(`Key "${fullKey}" has an invalid value type: ${typeof value}.`);
      }
    }
  }

  private _checkInterpolation(key: string, value: string, warnings: string[]): void {
    const unclosed = (value.match(/\{\{/g) ?? []).length;
    const closed   = (value.match(/\}\}/g) ?? []).length;
    if (unclosed !== closed) {
      warnings.push(`Key "${key}": mismatched interpolation delimiters.`);
    }
  }

  private _countKeys(data: TranslationMap, depth = 0): number {
    if (depth > 10) return 0;  // guard against extreme nesting
    let count = 0;
    for (const val of Object.values(data)) {
      if (typeof val === 'string') {
        count++;
      } else if (typeof val === 'object' && val !== null) {
        count += this._countKeys(val as TranslationMap, depth + 1);
      }
    }
    return count;
  }
}
