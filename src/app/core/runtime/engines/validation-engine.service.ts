import { Injectable, inject } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { ValidationRegistryService } from '../../registry/registries/validation.registry';

export interface FieldValidationConfig {
  validatorId: string;
  params?: unknown;
  message?: string;
}

export interface ValidationEngineResult {
  valid: boolean;
  errors: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ValidationEngineService {
  private readonly validationRegistry = inject(ValidationRegistryService);

  getValidator(config: FieldValidationConfig) {
    return this.validationRegistry.getValidator(config.validatorId, config.params, config.message);
  }

  getValidators(configs: FieldValidationConfig[]) {
    return configs
      .map(c => this.getValidator(c))
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }

  validateControl(
    control: AbstractControl,
    configs: FieldValidationConfig[],
  ): ValidationEngineResult {
    const errors: Record<string, string> = {};

    for (const config of configs) {
      const validator = this.getValidator(config);
      if (!validator) continue;

      const result: ValidationErrors | null = validator(control);
      if (result) {
        for (const [key, value] of Object.entries(result)) {
          errors[key] = typeof value === 'string' ? value : config.message ?? `${key} validation failed`;
        }
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  applyToForm(form: FormGroup, fieldConfigs: Record<string, FieldValidationConfig[]>): void {
    for (const [fieldKey, configs] of Object.entries(fieldConfigs)) {
      const control = form.get(fieldKey);
      if (!control) continue;

      const validators = this.getValidators(configs);
      control.addValidators(validators);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  validateObject(
    data: Record<string, unknown>,
    schema: Record<string, FieldValidationConfig[]>,
  ): ValidationEngineResult {
    const allErrors: Record<string, string> = {};

    for (const [field, configs] of Object.entries(schema)) {
      for (const config of configs) {
        const validator = this.getValidator(config);
        if (!validator) continue;

        const pseudoControl = { value: data[field] } as AbstractControl;
        const result = validator(pseudoControl);
        if (result) {
          for (const [key, value] of Object.entries(result)) {
            allErrors[`${field}.${key}`] = typeof value === 'string' ? value : config.message ?? `${field} is invalid`;
          }
        }
      }
    }

    return { valid: Object.keys(allErrors).length === 0, errors: allErrors };
  }
}
