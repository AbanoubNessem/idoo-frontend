import { ThemeDefinition, ThemeTokens } from './theme.types';
import { ExperienceResolutionPolicy } from '../resolution/experience-resolution-policy';
import { DEFAULT_RESOLUTION_POLICY } from '../resolution/experience-resolution-policy';

// ─── CSS Variable Prefixes ────────────────────────────────────────────────────

export const THEME_CSS_PREFIX_COLOR      = '--platform-color-';
export const THEME_CSS_PREFIX_SPACING    = '--platform-spacing-';
export const THEME_CSS_PREFIX_RADIUS     = '--platform-radius-';
export const THEME_CSS_PREFIX_ELEVATION  = '--platform-elevation-';
export const THEME_CSS_PREFIX_BREAKPOINT = '--platform-breakpoint-';
export const THEME_CSS_PREFIX_CUSTOM     = '--platform-custom-';

// ─── Schema ───────────────────────────────────────────────────────────────────

export const THEME_SCHEMA_VERSION = '1.0';

// ─── Built-in Light Theme ─────────────────────────────────────────────────────

export const PLATFORM_LIGHT_TOKENS: ThemeTokens = {
  colors: {
    'primary':          '#1976d2',
    'primary-dark':     '#1565c0',
    'primary-light':    '#e3f2fd',
    'primary-fg':       '#ffffff',
    'secondary':        '#9c27b0',
    'secondary-dark':   '#7b1fa2',
    'secondary-light':  '#f3e5f5',
    'secondary-fg':     '#ffffff',
    'success':          '#388e3c',
    'warning':          '#f57c00',
    'error':            '#d32f2f',
    'info':             '#0288d1',
    'background':       '#f5f5f5',
    'surface':          '#ffffff',
    'surface-alt':      '#fafafa',
    'surface-raised':   '#ffffff',
    'text-primary':     'rgba(0,0,0,0.87)',
    'text-secondary':   'rgba(0,0,0,0.60)',
    'text-disabled':    'rgba(0,0,0,0.38)',
    'text-inverse':     '#ffffff',
    'border':           'rgba(0,0,0,0.12)',
    'border-focus':     '#1976d2',
  },
  spacing: {
    '1':  '4px',
    '2':  '8px',
    '3':  '12px',
    '4':  '16px',
    '5':  '20px',
    '6':  '24px',
    '8':  '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
  },
  radius: {
    none: '0',
    sm:   '2px',
    md:   '4px',
    lg:   '8px',
    xl:   '12px',
    full: '9999px',
  },
  elevation: {
    none: 'none',
    xs:   '0 1px 2px rgba(0,0,0,0.08)',
    sm:   '0 2px 4px rgba(0,0,0,0.10)',
    md:   '0 4px 8px rgba(0,0,0,0.12)',
    lg:   '0 8px 16px rgba(0,0,0,0.14)',
    xl:   '0 16px 32px rgba(0,0,0,0.16)',
  },
  breakpoints: {
    xs:  '0px',
    sm:  '576px',
    md:  '768px',
    lg:  '992px',
    xl:  '1200px',
    xxl: '1400px',
  },
};

// ─── Built-in Dark Theme ──────────────────────────────────────────────────────

export const PLATFORM_DARK_TOKENS: ThemeTokens = {
  colors: {
    'primary':          '#90caf9',
    'primary-dark':     '#42a5f5',
    'primary-light':    '#1565c0',
    'primary-fg':       '#0d1117',
    'secondary':        '#ce93d8',
    'secondary-dark':   '#ba68c8',
    'secondary-light':  '#4a148c',
    'secondary-fg':     '#0d1117',
    'success':          '#81c784',
    'warning':          '#ffb74d',
    'error':            '#ef9a9a',
    'info':             '#4fc3f7',
    'background':       '#0d1117',
    'surface':          '#161b22',
    'surface-alt':      '#21262d',
    'surface-raised':   '#30363d',
    'text-primary':     'rgba(255,255,255,0.87)',
    'text-secondary':   'rgba(255,255,255,0.60)',
    'text-disabled':    'rgba(255,255,255,0.38)',
    'text-inverse':     'rgba(0,0,0,0.87)',
    'border':           'rgba(255,255,255,0.12)',
    'border-focus':     '#90caf9',
  },
  spacing:    { ...PLATFORM_LIGHT_TOKENS.spacing },
  radius:     { ...PLATFORM_LIGHT_TOKENS.radius },
  elevation: {
    none: 'none',
    xs:   '0 1px 2px rgba(0,0,0,0.40)',
    sm:   '0 2px 4px rgba(0,0,0,0.48)',
    md:   '0 4px 8px rgba(0,0,0,0.56)',
    lg:   '0 8px 16px rgba(0,0,0,0.64)',
    xl:   '0 16px 32px rgba(0,0,0,0.72)',
  },
  breakpoints: { ...PLATFORM_LIGHT_TOKENS.breakpoints },
};

// ─── Built-in High-Contrast Theme ─────────────────────────────────────────────

export const PLATFORM_HIGH_CONTRAST_TOKENS: ThemeTokens = {
  colors: {
    'primary':          '#0000ff',
    'primary-dark':     '#0000cc',
    'primary-light':    '#ccccff',
    'primary-fg':       '#ffffff',
    'secondary':        '#800080',
    'secondary-dark':   '#600060',
    'secondary-light':  '#ffccff',
    'secondary-fg':     '#ffffff',
    'success':          '#008000',
    'warning':          '#804000',
    'error':            '#cc0000',
    'info':             '#000080',
    'background':       '#ffffff',
    'surface':          '#ffffff',
    'surface-alt':      '#f0f0f0',
    'surface-raised':   '#ffffff',
    'text-primary':     '#000000',
    'text-secondary':   '#000000',
    'text-disabled':    '#595959',
    'text-inverse':     '#ffffff',
    'border':           '#000000',
    'border-focus':     '#0000ff',
  },
  spacing:     { ...PLATFORM_LIGHT_TOKENS.spacing },
  radius:      { ...PLATFORM_LIGHT_TOKENS.radius },
  elevation:   { none: 'none', xs: 'none', sm: 'none', md: 'none', lg: 'none', xl: 'none' },
  breakpoints: { ...PLATFORM_LIGHT_TOKENS.breakpoints },
};

// ─── Built-in Theme Definitions ───────────────────────────────────────────────

export const PLATFORM_LIGHT_THEME: ThemeDefinition = {
  id:          'platform-light',
  name:        'Light',
  kind:        'theme',
  variant:     'light',
  tokens:      PLATFORM_LIGHT_TOKENS,
  description: 'Platform default light theme',
  tags:        ['built-in', 'light'],
};

export const PLATFORM_DARK_THEME: ThemeDefinition = {
  id:          'platform-dark',
  name:        'Dark',
  kind:        'theme',
  variant:     'dark',
  tokens:      PLATFORM_DARK_TOKENS,
  description: 'Platform default dark theme',
  tags:        ['built-in', 'dark'],
};

export const PLATFORM_HIGH_CONTRAST_THEME: ThemeDefinition = {
  id:          'platform-high-contrast',
  name:        'High Contrast',
  kind:        'theme',
  variant:     'high-contrast',
  tokens:      PLATFORM_HIGH_CONTRAST_TOKENS,
  description: 'Platform high-contrast accessibility theme',
  tags:        ['built-in', 'accessibility', 'high-contrast'],
};

export const BUILT_IN_THEMES: ReadonlyArray<ThemeDefinition> = [
  PLATFORM_LIGHT_THEME,
  PLATFORM_DARK_THEME,
  PLATFORM_HIGH_CONTRAST_THEME,
];

export const DEFAULT_PLATFORM_THEME_ID = 'platform-light';

// ─── Default Resolution Policy ────────────────────────────────────────────────

export const THEME_DEFAULT_RESOLUTION_POLICY: ExperienceResolutionPolicy = DEFAULT_RESOLUTION_POLICY;

// ─── Required Color Tokens ────────────────────────────────────────────────────

export const REQUIRED_COLOR_TOKENS: ReadonlyArray<string> = [
  'primary', 'background', 'surface',
  'text-primary', 'text-secondary', 'border',
];
