// ─── Countries ────────────────────────────────────────────────────────────────

export interface MockCountry {
  readonly code:  string;
  readonly label: string;
  readonly flag?: string;
}

export const MOCK_COUNTRIES: MockCountry[] = [
  { code: 'AE', label: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'US', label: 'United States',         flag: '🇺🇸' },
  { code: 'GB', label: 'United Kingdom',        flag: '🇬🇧' },
  { code: 'DE', label: 'Germany',               flag: '🇩🇪' },
  { code: 'FR', label: 'France',                flag: '🇫🇷' },
  { code: 'JP', label: 'Japan',                 flag: '🇯🇵' },
  { code: 'CN', label: 'China',                 flag: '🇨🇳' },
  { code: 'IN', label: 'India',                 flag: '🇮🇳' },
  { code: 'BR', label: 'Brazil',                flag: '🇧🇷' },
  { code: 'CA', label: 'Canada',                flag: '🇨🇦' },
  { code: 'AU', label: 'Australia',             flag: '🇦🇺' },
  { code: 'SA', label: 'Saudi Arabia',          flag: '🇸🇦' },
  { code: 'EG', label: 'Egypt',                 flag: '🇪🇬' },
  { code: 'ZA', label: 'South Africa',          flag: '🇿🇦' },
  { code: 'SG', label: 'Singapore',             flag: '🇸🇬' },
  { code: 'NL', label: 'Netherlands',           flag: '🇳🇱' },
  { code: 'SE', label: 'Sweden',                flag: '🇸🇪' },
  { code: 'CH', label: 'Switzerland',           flag: '🇨🇭' },
  { code: 'KR', label: 'South Korea',           flag: '🇰🇷' },
  { code: 'MX', label: 'Mexico',                flag: '🇲🇽' },
];

// ─── Account Managers ─────────────────────────────────────────────────────────

export interface MockAccountManager {
  readonly id:   string;
  readonly name: string;
  readonly role: string;
}

export const MOCK_ACCOUNT_MANAGERS: MockAccountManager[] = [
  { id: 'am-01', name: 'Sarah Johnson',   role: 'account_manager' },
  { id: 'am-02', name: 'Michael Chen',    role: 'account_manager' },
  { id: 'am-03', name: 'Fatima Al-Rashid', role: 'account_manager' },
  { id: 'am-04', name: 'Carlos Rivera',   role: 'account_manager' },
  { id: 'am-05', name: 'Emma Wilson',     role: 'account_manager' },
];

// ─── Initial Customer Model ───────────────────────────────────────────────────

export const CUSTOMER_INITIAL_MODEL: Record<string, unknown> = {
  customerType:  'business',
  isActive:      true,
  sameAsBilling: true,
  currency:      'USD',
  language:      'en',
};

// ─── Demo Permissions ─────────────────────────────────────────────────────────

export const DEMO_DEFAULT_PERMISSIONS: string[] = [
  'customers:read',
  'customers:write',
  'can_view_financial',
  'can_set_tax_status',
];

export const DEMO_RESTRICTED_PERMISSIONS: string[] = [
  'customers:read',
];
