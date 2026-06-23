import { Validators } from '@angular/forms';
import { FormSchema } from '../../../shared/models/dynamic-form.models';
import { CompanyResponse } from '../../../core/api/models';

/**
 * Declarative form schema for Create / Edit / View User screens.
 * Passed straight into <app-dynamic-form>. Replaces 3 separate hand-built forms.
 */
export function buildUserFormSchema(companies: CompanyResponse[]): FormSchema {
  return {
    columns: 2,
    fields: [
      { key: 'firstName', type: 'text', label: 'First Name', required: true, order: 1 },
      { key: 'lastName', type: 'text', label: 'Last Name', required: true, order: 2 },
      {
        key: 'username', type: 'text', label: 'Username', required: true, order: 3,
        validators: [Validators.minLength(3), Validators.maxLength(50)],
        errorMessages: { required: 'Username is required', minlength: 'Minimum 3 characters' },
      },
      {
        key: 'email', type: 'email', label: 'Email', required: true, order: 4,
        validators: [Validators.email],
        errorMessages: { required: 'Email is required', email: 'Enter a valid email address' },
      },
      { key: 'phone', type: 'text', label: 'Phone', order: 5 },
      {
        key: 'companyId', type: 'select', label: 'Company', required: true, order: 6,
        options: companies.map(c => ({ label: c.name, value: c.id })),
      },
      {
        key: 'languageCode', type: 'select', label: 'Language', order: 7, defaultValue: 'en',
        options: [{ label: 'English', value: 'en' }, { label: 'Arabic', value: 'ar' }],
      },
      { key: 'timezone', type: 'text', label: 'Timezone', order: 8, defaultValue: 'UTC' },
    ],
  };
}
