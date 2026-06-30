import { CultureDefinition } from './culture.types';

// ─── RTL Languages ────────────────────────────────────────────────────────────

export const RTL_LANGUAGE_CODES = new Set<string>([
  'ar', 'he', 'fa', 'ur', 'yi', 'ku', 'ps', 'dv', 'sd',
]);

// ─── Built-in Culture Definitions ─────────────────────────────────────────────

export const CULTURE_EN_US: CultureDefinition = {
  code:              'en-US',
  language:          'en',
  region:            'US',
  name:              'English (United States)',
  nativeName:        'English (United States)',
  direction:         'ltr',
  timezone:          'America/New_York',
  calendar:          'gregory',
  weekStart:         0,   // Sunday
  numberSystem:      'latn',
  measurementSystem: 'us',
  currency:          'USD',
  tags:              ['built-in', 'default'],
};

export const CULTURE_EN_GB: CultureDefinition = {
  code:              'en-GB',
  language:          'en',
  region:            'GB',
  name:              'English (United Kingdom)',
  nativeName:        'English (United Kingdom)',
  direction:         'ltr',
  timezone:          'Europe/London',
  calendar:          'gregory',
  weekStart:         1,   // Monday
  numberSystem:      'latn',
  measurementSystem: 'metric',
  currency:          'GBP',
  tags:              ['built-in'],
};

export const CULTURE_AR_SA: CultureDefinition = {
  code:              'ar-SA',
  language:          'ar',
  region:            'SA',
  name:              'Arabic (Saudi Arabia)',
  nativeName:        'العربية (المملكة العربية السعودية)',
  direction:         'rtl',
  timezone:          'Asia/Riyadh',
  calendar:          'islamic',
  weekStart:         0,   // Sunday (Saudi Arabia)
  numberSystem:      'arab',
  measurementSystem: 'metric',
  currency:          'SAR',
  tags:              ['built-in', 'rtl'],
};

export const CULTURE_AR_EG: CultureDefinition = {
  code:              'ar-EG',
  language:          'ar',
  region:            'EG',
  name:              'Arabic (Egypt)',
  nativeName:        'العربية (مصر)',
  direction:         'rtl',
  timezone:          'Africa/Cairo',
  calendar:          'gregory',
  weekStart:         6,   // Saturday (Egypt work week)
  numberSystem:      'arab',
  measurementSystem: 'metric',
  currency:          'EGP',
  tags:              ['built-in', 'rtl'],
};

export const CULTURE_DE_DE: CultureDefinition = {
  code:              'de-DE',
  language:          'de',
  region:            'DE',
  name:              'German (Germany)',
  nativeName:        'Deutsch (Deutschland)',
  direction:         'ltr',
  timezone:          'Europe/Berlin',
  calendar:          'gregory',
  weekStart:         1,
  numberSystem:      'latn',
  measurementSystem: 'metric',
  currency:          'EUR',
  tags:              ['built-in'],
};

export const CULTURE_FR_FR: CultureDefinition = {
  code:              'fr-FR',
  language:          'fr',
  region:            'FR',
  name:              'French (France)',
  nativeName:        'Français (France)',
  direction:         'ltr',
  timezone:          'Europe/Paris',
  calendar:          'gregory',
  weekStart:         1,
  numberSystem:      'latn',
  measurementSystem: 'metric',
  currency:          'EUR',
  tags:              ['built-in'],
};

export const CULTURE_ZH_CN: CultureDefinition = {
  code:              'zh-CN',
  language:          'zh',
  region:            'CN',
  name:              'Chinese (Simplified, China)',
  nativeName:        '中文（简体，中国）',
  direction:         'ltr',
  timezone:          'Asia/Shanghai',
  calendar:          'gregory',
  weekStart:         1,
  numberSystem:      'latn',
  measurementSystem: 'metric',
  currency:          'CNY',
  tags:              ['built-in'],
};

export const BUILT_IN_CULTURES: ReadonlyArray<CultureDefinition> = [
  CULTURE_EN_US,
  CULTURE_EN_GB,
  CULTURE_AR_SA,
  CULTURE_AR_EG,
  CULTURE_DE_DE,
  CULTURE_FR_FR,
  CULTURE_ZH_CN,
];

export const DEFAULT_CULTURE_CODE   = 'en-US';
export const FALLBACK_CULTURE_CODE  = 'en-US';
export const CULTURE_SCHEMA_VERSION = '1.0';
