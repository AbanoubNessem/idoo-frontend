import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export type ValidatorFactory = (
  params?: unknown,
  message?: string,
) => (control: AbstractControl) => ValidationErrors | null;

export interface ValidatorDef {
  id: string;
  factory: ValidatorFactory;
  defaultMessage: string;
  label?: string;
  description?: string;
  paramSchema?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ValidationRegistryService extends BaseRegistry<ValidatorDef> {
  readonly name = 'validation';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';

  getValidator(id: string, params?: unknown, message?: string) {
    const entry = this.getById(id);
    if (!entry) return null;
    return entry.definition.factory(params, message);
  }
}
