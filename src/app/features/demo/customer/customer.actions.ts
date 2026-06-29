import { defineAction } from '../platform-api';

export const SaveCustomerAction = defineAction({
  id:          'save-customer',
  label:       'Save Customer',
  icon:        'save',
  variant:     'primary',
  permissions: ['customers:write'],
  handler:     'submit',
});

export const DiscardAction = defineAction({
  id:      'discard-customer',
  label:   'Discard',
  icon:    'close',
  variant: 'ghost',
  handler: 'cancel',
});

export const DeleteCustomerAction = defineAction({
  id:               'delete-customer',
  label:            'Delete Customer',
  icon:             'delete',
  variant:          'danger',
  permissions:      ['customers:delete'],
  hiddenExpression: 'mode === "create"',
  handler:          'delete',
});

export const SaveDraftAction = defineAction({
  id:          'save-draft',
  label:       'Save Draft',
  icon:        'drafts',
  variant:     'secondary',
  permissions: ['customers:write'],
  handler:     'draft',
});

export const CustomerActions = [
  SaveCustomerAction,
  DiscardAction,
  DeleteCustomerAction,
  SaveDraftAction,
] as const;
