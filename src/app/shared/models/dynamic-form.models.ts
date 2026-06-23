import { ValidatorFn } from '@angular/forms';

export type FieldType =
  | 'text' | 'email' | 'password' | 'number' | 'textarea'
  | 'select' | 'multiselect' | 'autocomplete'
  | 'date' | 'datetime' | 'checkbox' | 'toggle' | 'radio'
  | 'hidden' | 'divider' | 'section';

export interface SelectOption {
  label: string;
  value: unknown;
  disabled?: boolean;
  icon?: string;
}

export interface FormFieldSchema {
  key: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  defaultValue?: unknown;
  validators?: ValidatorFn[];
  errorMessages?: Record<string, string>;

  // Select/Autocomplete
  options?: SelectOption[];
  optionsLoader?: () => SelectOption[];           // Lazy load
  optionsKey?: string;                             // Key in shared options map

  // Layout
  fullWidth?: boolean;
  order?: number;
  section?: string;

  // Conditional visibility
  showWhen?: (formValue: Record<string, unknown>) => boolean;
}

export interface FormSchema {
  fields: FormFieldSchema[];
  columns?: 1 | 2 | 3;
  submitLabel?: string;
  cancelLabel?: string;
  readonly?: boolean;
}

export type FormMode = 'create' | 'edit' | 'view';
