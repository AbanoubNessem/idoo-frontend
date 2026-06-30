import { Injectable } from '@angular/core';
import { ThemeDefinition, ThemeValidationResult } from './theme.types';
import { REQUIRED_COLOR_TOKENS } from './theme.constants';

@Injectable({ providedIn: 'root' })
export class ThemeValidatorService {
  validate(theme: ThemeDefinition): ThemeValidationResult {
    const errors:   string[] = [];
    const warnings: string[] = [];

    if (!theme.id?.trim()) {
      errors.push('Theme id is required and must not be empty.');
    }
    if (!theme.name?.trim()) {
      errors.push('Theme name is required and must not be empty.');
    }
    if (theme.kind !== 'theme') {
      errors.push(`Theme kind must be "theme", got "${theme.kind}".`);
    }
    if (!theme.variant) {
      errors.push('Theme variant is required (light | dark | high-contrast | custom | tenant | company | user).');
    }
    if (!theme.tokens) {
      errors.push('Theme tokens are required.');
    } else {
      if (!theme.tokens.colors || typeof theme.tokens.colors !== 'object') {
        errors.push('Theme tokens.colors is required and must be an object.');
      } else {
        for (const key of REQUIRED_COLOR_TOKENS) {
          if (!theme.tokens.colors[key]) {
            errors.push(`Required color token "${key}" is missing.`);
          }
        }

        for (const [key, val] of Object.entries(theme.tokens.colors)) {
          if (val !== undefined && !this._isValidCssValue(val)) {
            warnings.push(`Color token "${key}" value "${val}" may not be a valid CSS value.`);
          }
        }
      }

      if (theme.tokens.spacing) {
        for (const [key, val] of Object.entries(theme.tokens.spacing)) {
          if (val !== undefined && !this._isValidCssLength(val)) {
            warnings.push(`Spacing token "${key}" value "${val}" should be a CSS length.`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  isValid(theme: ThemeDefinition): boolean {
    return this.validate(theme).valid;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _isValidCssValue(val: string): boolean {
    return typeof val === 'string' && val.trim().length > 0;
  }

  private _isValidCssLength(val: string): boolean {
    return /^(\d+(\.\d+)?(px|em|rem|%|vw|vh|vmin|vmax|ch|ex)|0|auto|inherit|initial|unset|var\(--[^)]+\))$/.test(val.trim());
  }
}
