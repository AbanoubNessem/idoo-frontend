import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface FormSectionDef {
  id: string;
  title?: string;
  columns?: 1 | 2 | 3 | 4;
  fields: FormFieldDef[];
}

export interface FormFieldDef {
  key: string;
  type: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: (model: Record<string, unknown>) => boolean;
  defaultValue?: unknown;
  options?: Array<{ value: unknown; label: string }>;
  validators?: string[];
  [key: string]: unknown;
}

export interface FormDef {
  sections: FormSectionDef[];
  layout?: 'single-column' | 'two-column' | 'tabbed';
  hooks?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class FormRegistryService extends BaseRegistry<FormDef> {
  readonly name = 'form';
  readonly mergeStrategy: MergeStrategy = 'DEEP';

  protected override validate(id: string, def: FormDef): string[] {
    const errors: string[] = [];
    if (!def.sections || def.sections.length === 0) {
      errors.push(`${id}: form must have at least one section`);
    }
    return errors;
  }
}
