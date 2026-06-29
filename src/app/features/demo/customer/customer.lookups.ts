import { defineLookup } from '../platform-api';

export const CountryLookup = defineLookup({
  id:        'country',
  label:     'Country',
  queryType: 'country',
  valueKey:  'code',
  labelKey:  'label',
  config: {
    searchable: true,
    minChars:   1,
    debounceMs: 200,
  },
});

export const IndustryLookup = defineLookup({
  id:        'industry',
  label:     'Industry',
  queryType: 'industry',
  valueKey:  'value',
  labelKey:  'label',
  config: {
    searchable: false,
    minChars:   0,
  },
});

export const AccountManagerLookup = defineLookup({
  id:        'account-manager',
  label:     'Account Manager',
  queryType: 'user',
  valueKey:  'id',
  labelKey:  'name',
  config: {
    searchable:  true,
    minChars:    1,
    debounceMs:  300,
    filterRoles: ['account_manager'],
  },
});

export const CustomerLookups = [CountryLookup, IndustryLookup, AccountManagerLookup] as const;
