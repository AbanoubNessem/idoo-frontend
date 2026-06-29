import { defineForm } from '../platform-api';
import { MOCK_COUNTRIES, MOCK_ACCOUNT_MANAGERS } from '../mock/mock-data';

// ─── Customer Form Definition ─────────────────────────────────────────────────
// Defined entirely via platform API — no Angular Forms, no Material imports.
// Demonstrates: tabs, sections, groups, arrays, expressions, validators, permissions.

export const CustomerFormDef = defineForm({
  id:               'customer-create',
  version:          '2.0',
  mode:             'create',
  layout:           'tabs',
  title:            'New Customer',
  description:      'Create a new customer record using the platform form engine',
  showErrorSummary: true,
  scrollToFirstError: true,
  draftMode:        true,
  showActions:      true,
  submitLabel:      'Save Customer',
  cancelLabel:      'Discard',

  tabs: [
    // ─── Tab 1: Basic Information ────────────────────────────────────────────
    {
      id:    'basic',
      title: 'Basic Info',
      icon:  'person',
      sections: [
        {
          id:       'identity',
          title:    'Identity',
          layout:   'grid',
          columns:  2,
          fields: [
            {
              key:        'firstName',
              type:       'text',
              label:      'First Name',
              required:   true,
              span:       1,
              validators: [{ type: 'required', message: 'First name is required' }],
            },
            {
              key:        'lastName',
              type:       'text',
              label:      'Last Name',
              required:   true,
              span:       1,
              validators: [{ type: 'required', message: 'Last name is required' }],
            },
            {
              key:   'displayName',
              type:  'text',
              label: 'Display Name',
              hint:  'Shown to users in the system',
              span:  2,
              // Computed from first + last name via expression
              valueExpression: 'firstName && lastName ? firstName + " " + lastName : displayName',
            },
            {
              key:      'customerType',
              type:     'select',
              label:    'Customer Type',
              required: true,
              span:     1,
              validators: [{ type: 'required', message: 'Customer type is required' }],
              config: {
                options: [
                  { label: 'Individual',  value: 'individual' },
                  { label: 'Business',    value: 'business' },
                  { label: 'Government',  value: 'government' },
                ],
              },
            },
            {
              key:              'industry',
              type:             'select',
              label:            'Industry',
              span:             1,
              hiddenExpression: 'customerType === "individual"',
              config: {
                options: [
                  { label: 'Technology',    value: 'tech' },
                  { label: 'Finance',       value: 'finance' },
                  { label: 'Healthcare',    value: 'healthcare' },
                  { label: 'Retail',        value: 'retail' },
                  { label: 'Manufacturing', value: 'manufacturing' },
                  { label: 'Real Estate',   value: 'realestate' },
                  { label: 'Education',     value: 'education' },
                  { label: 'Other',         value: 'other' },
                ],
              },
            },
            {
              key:              'accountManager',
              type:             'select',
              label:            'Account Manager',
              span:             2,
              hint:             'Select a team member to manage this account',
              config: {
                options: MOCK_ACCOUNT_MANAGERS.map(m => ({ label: m.name, value: m.id })),
              },
            },
          ],
        },
        {
          id:      'contact-info',
          title:   'Contact Information',
          layout:  'grid',
          columns: 2,
          fields: [
            {
              key:               'email',
              type:              'text',
              label:             'Email Address',
              hint:              'Used for system notifications',
              span:              1,
              requiredExpression: 'customerType === "business" || customerType === "government"',
              validators:        [{ type: 'email', message: 'Enter a valid email address' }],
            },
            {
              key:        'phone',
              type:       'text',
              label:      'Phone Number',
              span:       1,
              validators: [{ type: 'phone', message: 'Enter a valid phone number' }],
            },
            {
              key:              'website',
              type:             'text',
              label:            'Website',
              span:             1,
              placeholder:      'https://example.com',
              hiddenExpression: 'customerType === "individual"',
            },
            {
              key:              'vatNumber',
              type:             'text',
              label:            'VAT / Tax Number',
              span:             1,
              hiddenExpression: 'customerType !== "business" && customerType !== "government"',
              permissions:      ['can_view_financial'],
              hint:             'Required for tax invoicing',
            },
          ],
        },
      ],
    },

    // ─── Tab 2: Address ───────────────────────────────────────────────────────
    {
      id:    'address',
      title: 'Address',
      icon:  'location_on',
      sections: [
        {
          id:      'billing-address',
          title:   'Billing Address',
          layout:  'grid',
          columns: 2,
          fields: [
            { key: 'street',   type: 'text',   label: 'Street Address', span: 2 },
            { key: 'city',     type: 'text',   label: 'City',           span: 1 },
            { key: 'state',    type: 'text',   label: 'State / Province', span: 1 },
            { key: 'postcode', type: 'text',   label: 'Postcode / ZIP', span: 1 },
            {
              key:    'country',
              type:   'select',
              label:  'Country',
              span:   1,
              config: {
                options: MOCK_COUNTRIES.map(c => ({ label: c.label, value: c.code })),
              },
            },
          ],
        },
        {
          id:          'shipping-address',
          title:       'Shipping Address',
          layout:      'grid',
          columns:     2,
          collapsible: true,
          collapsed:   true,
          fields: [
            {
              key:   'sameAsBilling',
              type:  'checkbox',
              label: 'Same as billing address',
              span:  2,
              defaultValue: true,
            },
            {
              key:              'shipStreet',
              type:             'text',
              label:            'Street Address',
              span:             2,
              hiddenExpression: 'sameAsBilling === true',
            },
            {
              key:              'shipCity',
              type:             'text',
              label:            'City',
              span:             1,
              hiddenExpression: 'sameAsBilling === true',
            },
            {
              key:              'shipPostcode',
              type:             'text',
              label:            'Postcode / ZIP',
              span:             1,
              hiddenExpression: 'sameAsBilling === true',
            },
            {
              key:              'shipCountry',
              type:             'select',
              label:            'Country',
              span:             2,
              hiddenExpression: 'sameAsBilling === true',
              config: {
                options: MOCK_COUNTRIES.map(c => ({ label: c.label, value: c.code })),
              },
            },
          ],
        },
      ],
    },

    // ─── Tab 3: Contacts (Array) ──────────────────────────────────────────────
    {
      id:    'contacts',
      title: 'Contacts',
      icon:  'contacts',
      sections: [
        {
          id:      'contact-persons',
          title:   'Contact Persons',
          layout:  'stack',
          columns: 1,
          arrays: [
            {
              key:         'contacts',
              type:        'array',
              label:       'Contact Persons',
              addLabel:    'Add Contact',
              removeLabel: 'Remove',
              minItems:    0,
              maxItems:    10,
              sortable:    true,
              itemSchema: {
                id:      'contact-item',
                layout:  'grid',
                columns: 3,
                fields: [
                  { key: 'contactFirstName', type: 'text', label: 'First Name', span: 1, required: true,
                    validators: [{ type: 'required' }] },
                  { key: 'contactLastName',  type: 'text', label: 'Last Name',  span: 1, required: true,
                    validators: [{ type: 'required' }] },
                  { key: 'contactRole', type: 'select', label: 'Role', span: 1,
                    config: {
                      options: [
                        { label: 'Primary',  value: 'primary' },
                        { label: 'Billing',  value: 'billing' },
                        { label: 'Technical', value: 'technical' },
                        { label: 'Legal',    value: 'legal' },
                      ],
                    },
                  },
                  { key: 'contactEmail', type: 'text', label: 'Email', span: 2,
                    validators: [{ type: 'email' }] },
                  { key: 'contactPhone', type: 'text', label: 'Phone', span: 1,
                    validators: [{ type: 'phone' }] },
                ],
              },
            },
          ],
        },
      ],
    },

    // ─── Tab 4: Advanced ─────────────────────────────────────────────────────
    {
      id:    'advanced',
      title: 'Advanced',
      icon:  'settings',
      sections: [
        {
          id:      'preferences',
          title:   'Preferences & Settings',
          layout:  'grid',
          columns: 2,
          fields: [
            {
              key:    'currency',
              type:   'select',
              label:  'Default Currency',
              span:   1,
              defaultValue: 'USD',
              config: {
                options: [
                  { label: 'USD ($)',    value: 'USD' },
                  { label: 'EUR (€)',    value: 'EUR' },
                  { label: 'GBP (£)',    value: 'GBP' },
                  { label: 'AED (د.إ)', value: 'AED' },
                  { label: 'SAR (﷼)',   value: 'SAR' },
                  { label: 'JPY (¥)',   value: 'JPY' },
                ],
              },
            },
            {
              key:    'language',
              type:   'select',
              label:  'Preferred Language',
              span:   1,
              defaultValue: 'en',
              config: {
                options: [
                  { label: 'English (EN)', value: 'en' },
                  { label: 'Arabic (AR)',  value: 'ar' },
                  { label: 'French (FR)',  value: 'fr' },
                  { label: 'German (DE)',  value: 'de' },
                ],
              },
            },
            {
              key:          'isActive',
              type:         'switch',
              label:        'Account Active',
              span:         1,
              defaultValue: true,
              hint:         'Inactive accounts cannot log in',
            },
            {
              key:              'isTaxExempt',
              type:             'switch',
              label:            'Tax Exempt',
              span:             1,
              hiddenExpression: 'customerType === "individual"',
              permissions:      ['can_set_tax_status'],
              hint:             'Requires tax-exempt certificate on file',
            },
          ],
        },
        {
          id:      'notes-section',
          title:   'Notes & Classification',
          layout:  'stack',
          columns: 1,
          fields: [
            {
              key:    'internalNotes',
              type:   'textarea',
              label:  'Internal Notes',
              hint:   'Not visible to the customer',
              config: { rows: 4 },
            },
            {
              key:    'tags',
              type:   'chip',
              label:  'Tags',
              hint:   'Press Enter or comma to add a tag',
              config: {
                suggestions: ['vip', 'wholesale', 'retail', 'partner', 'reseller', 'prospect', 'churned'],
                maxChips:    10,
              },
            },
          ],
        },
      ],
    },
  ],
});

// ─── Edit variant (same structure, view mode) ────────────────────────────────
export const CustomerEditFormDef = defineForm({
  ...CustomerFormDef,
  id:    'customer-edit',
  mode:  'edit',
  title: 'Edit Customer',
});
