import { ExperienceDimension, ExperienceStateData } from './experience.types';

// ─── Dimension Order ──────────────────────────────────────────────────────────

export const EXPERIENCE_DIMENSIONS: ReadonlyArray<ExperienceDimension> = [
  'theme', 'language', 'locale', 'density', 'typography', 'icon-pack', 'branding',
];

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_EXPERIENCE_STATE: ExperienceStateData = {
  themeId:      null,
  languageCode: 'en',
  localeCode:   'en-US',
  direction:    'ltr',
  densityId:    'comfortable',
  typographyId: 'default',
  iconPackId:   'default',
  brandingId:   null,
};

// ─── Built-in Profile IDs ─────────────────────────────────────────────────────

export const DEFAULT_DENSITY_ID    = 'comfortable';
export const DEFAULT_LANGUAGE_CODE = 'en';
export const DEFAULT_LOCALE_CODE   = 'en-US';
export const DEFAULT_TYPOGRAPHY_ID = 'default';
export const DEFAULT_ICON_PACK_ID  = 'default';

// ─── RTL Languages (ISO 639-1) ────────────────────────────────────────────────

export const RTL_LANGUAGE_CODES = new Set<string>([
  'ar', 'he', 'fa', 'ur', 'yi', 'ku', 'ps', 'dv', 'sd',
]);

// ─── Schema ───────────────────────────────────────────────────────────────────

export const EXPERIENCE_SCHEMA_VERSION = '1.0' as const;

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const EXPERIENCE_STORAGE_KEY = 'idoo_experience_profile';
