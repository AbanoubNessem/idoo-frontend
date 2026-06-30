import {
  TypographyProfile, DensityProfile, IconPackProfile, MotionProfile,
  AccessibilityProfile,
} from './visual.types';

// ─── CSS Variable Prefixes ────────────────────────────────────────────────────

export const VISUAL_CSS_FONT_PREFIX      = '--platform-font-';
export const VISUAL_CSS_DENSITY_PREFIX   = '--platform-density-';
export const VISUAL_CSS_MOTION_PREFIX    = '--platform-motion-';
export const VISUAL_CSS_ICON_PREFIX      = '--platform-icon-';
export const VISUAL_CSS_A11Y_PREFIX      = '--platform-a11y-';

// ─── Default IDs ─────────────────────────────────────────────────────────────

export const DEFAULT_TYPOGRAPHY_ID    = 'typography-default';
export const DEFAULT_DENSITY_ID       = 'density-comfortable';
export const DEFAULT_ICON_PACK_ID     = 'material-symbols';
export const DEFAULT_MOTION_ID        = 'motion-normal';
export const DEFAULT_ACCESSIBILITY_ID = 'accessibility-default';

// ─── Built-in Typography Profiles ─────────────────────────────────────────────

export const TYPOGRAPHY_DEFAULT: TypographyProfile = {
  id:             DEFAULT_TYPOGRAPHY_ID,
  name:           'Default',
  description:    'Inter for Latin scripts — clean, legible, modern',
  fontFamilyBase: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  scale: {
    xs:    '10px',
    sm:    '12px',
    base:  '14px',
    lg:    '16px',
    xl:    '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  weights: {
    light:    '300',
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
  lineHeights: {
    tight:   '1.25',
    normal:  '1.5',
    relaxed: '1.75',
  },
  letterSpacing: {
    tight:  '-0.025em',
    normal: '0',
    wide:   '0.025em',
  },
  tags: ['latin', 'default', 'built-in'],
};

export const TYPOGRAPHY_ARABIC: TypographyProfile = {
  id:               'typography-arabic',
  name:             'Arabic / RTL',
  description:      'Cairo for Arabic scripts, Inter as Latin fallback',
  fontFamilyBase:   "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  fontFamilyArabic: "'Cairo', 'Noto Sans Arabic', 'Tahoma', sans-serif",
  fontFamilyMono:   "'JetBrains Mono', 'Consolas', monospace",
  scale: {
    xs:    '11px',
    sm:    '13px',
    base:  '15px',
    lg:    '17px',
    xl:    '21px',
    '2xl': '25px',
    '3xl': '31px',
    '4xl': '38px',
  },
  weights: {
    light:    '300',
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
  lineHeights: {
    tight:   '1.3',
    normal:  '1.6',
    relaxed: '1.8',
  },
  tags: ['arabic', 'rtl', 'built-in'],
};

export const TYPOGRAPHY_LARGE: TypographyProfile = {
  id:             'typography-large',
  name:           'Large Typography',
  description:    'Increased base sizes for accessibility',
  fontFamilyBase: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'Consolas', monospace",
  scale: {
    xs:    '12px',
    sm:    '14px',
    base:  '16px',
    lg:    '20px',
    xl:    '24px',
    '2xl': '30px',
    '3xl': '36px',
    '4xl': '48px',
  },
  weights: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
  lineHeights: {
    tight:   '1.3',
    normal:  '1.6',
    relaxed: '1.85',
  },
  tags: ['large', 'accessibility', 'built-in'],
};

export const BUILT_IN_TYPOGRAPHY_PROFILES: ReadonlyArray<TypographyProfile> = [
  TYPOGRAPHY_DEFAULT,
  TYPOGRAPHY_ARABIC,
  TYPOGRAPHY_LARGE,
];

// ─── Built-in Density Profiles ────────────────────────────────────────────────

export const DENSITY_COMPACT: DensityProfile = {
  id:          'density-compact',
  name:        'Compact',
  level:       'compact',
  description: 'Reduced spacing — maximizes screen real estate',
  heightSm:    '24px',
  heightMd:    '32px',
  heightLg:    '40px',
  paddingXs:   '2px',
  paddingSm:   '4px',
  paddingMd:   '8px',
  paddingLg:   '12px',
  gapSm:       '4px',
  gapMd:       '8px',
  gapLg:       '12px',
  tags: ['compact', 'built-in'],
};

export const DENSITY_COMFORTABLE: DensityProfile = {
  id:          DEFAULT_DENSITY_ID,
  name:        'Comfortable',
  level:       'comfortable',
  description: 'Balanced spacing — the default density',
  heightSm:    '32px',
  heightMd:    '40px',
  heightLg:    '48px',
  paddingXs:   '4px',
  paddingSm:   '8px',
  paddingMd:   '12px',
  paddingLg:   '16px',
  gapSm:       '8px',
  gapMd:       '12px',
  gapLg:       '16px',
  tags: ['comfortable', 'default', 'built-in'],
};

export const DENSITY_SPACIOUS: DensityProfile = {
  id:          'density-spacious',
  name:        'Spacious',
  level:       'spacious',
  description: 'Generous spacing — more breathing room',
  heightSm:    '40px',
  heightMd:    '48px',
  heightLg:    '56px',
  paddingXs:   '8px',
  paddingSm:   '12px',
  paddingMd:   '16px',
  paddingLg:   '24px',
  gapSm:       '12px',
  gapMd:       '16px',
  gapLg:       '24px',
  tags: ['spacious', 'built-in'],
};

export const BUILT_IN_DENSITY_PROFILES: ReadonlyArray<DensityProfile> = [
  DENSITY_COMPACT,
  DENSITY_COMFORTABLE,
  DENSITY_SPACIOUS,
];

// ─── Built-in Icon Pack Profiles ──────────────────────────────────────────────

export const ICON_PACK_MATERIAL_SYMBOLS: IconPackProfile = {
  id:          DEFAULT_ICON_PACK_ID,
  name:        'Material Symbols',
  type:        'material-symbols',
  prefix:      'material-symbols',
  cdnUrl:      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
  description: 'Google Material Symbols — variable icon font',
  tags: ['material', 'google', 'built-in', 'default'],
};

export const ICON_PACK_HEROICONS: IconPackProfile = {
  id:          'heroicons',
  name:        'Heroicons',
  type:        'heroicons',
  prefix:      'hi',
  description: 'Heroicons by Tailwind Labs — SVG icon set',
  tags: ['heroicons', 'tailwind', 'svg', 'built-in'],
};

export const ICON_PACK_FONT_AWESOME: IconPackProfile = {
  id:          'font-awesome',
  name:        'Font Awesome',
  type:        'font-awesome',
  prefix:      'fa',
  description: 'Font Awesome 6 — versatile icon font',
  tags: ['font-awesome', 'built-in'],
};

export const ICON_PACK_CUSTOM: IconPackProfile = {
  id:          'custom',
  name:        'Custom',
  type:        'custom',
  prefix:      'icon',
  description: 'Custom icon pack — loaded at runtime by tenant/company',
  tags: ['custom'],
};

export const BUILT_IN_ICON_PACK_PROFILES: ReadonlyArray<IconPackProfile> = [
  ICON_PACK_MATERIAL_SYMBOLS,
  ICON_PACK_HEROICONS,
  ICON_PACK_FONT_AWESOME,
  ICON_PACK_CUSTOM,
];

// ─── Built-in Motion Profiles ────────────────────────────────────────────────

export const MOTION_NORMAL: MotionProfile = {
  id:               DEFAULT_MOTION_ID,
  name:             'Normal Motion',
  reducedMotion:    false,
  durationScale:    1,
  durationFast:     '100ms',
  durationNormal:   '200ms',
  durationSlow:     '300ms',
  easingStandard:   'cubic-bezier(0.4, 0, 0.2, 1)',
  easingDecelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  easingAccelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  tags: ['normal', 'default', 'built-in'],
};

export const MOTION_REDUCED: MotionProfile = {
  id:               'motion-reduced',
  name:             'Reduced Motion',
  reducedMotion:    true,
  durationScale:    0,
  durationFast:     '0ms',
  durationNormal:   '0ms',
  durationSlow:     '0ms',
  easingStandard:   'linear',
  easingDecelerate: 'linear',
  easingAccelerate: 'linear',
  tags: ['reduced', 'accessibility', 'built-in'],
};

export const MOTION_SLOW: MotionProfile = {
  id:               'motion-slow',
  name:             'Slow Motion',
  reducedMotion:    false,
  durationScale:    2,
  durationFast:     '200ms',
  durationNormal:   '400ms',
  durationSlow:     '600ms',
  easingStandard:   'cubic-bezier(0.4, 0, 0.2, 1)',
  easingDecelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  easingAccelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  tags: ['slow', 'built-in'],
};

export const BUILT_IN_MOTION_PROFILES: ReadonlyArray<MotionProfile> = [
  MOTION_NORMAL,
  MOTION_REDUCED,
  MOTION_SLOW,
];

// ─── Built-in Accessibility Profiles ─────────────────────────────────────────

export const ACCESSIBILITY_DEFAULT: AccessibilityProfile = {
  id:              DEFAULT_ACCESSIBILITY_ID,
  name:            'Default',
  highContrast:    false,
  reducedMotion:   false,
  largeTypography: false,
  focusVisible:    false,
  tags: ['default', 'built-in'],
};

export const ACCESSIBILITY_HIGH_CONTRAST: AccessibilityProfile = {
  id:              'accessibility-high-contrast',
  name:            'High Contrast',
  highContrast:    true,
  reducedMotion:   false,
  largeTypography: false,
  focusVisible:    true,
  tags: ['high-contrast', 'accessibility', 'built-in'],
};

export const ACCESSIBILITY_FULL: AccessibilityProfile = {
  id:              'accessibility-full',
  name:            'Full Accessibility',
  highContrast:    true,
  reducedMotion:   true,
  largeTypography: true,
  focusVisible:    true,
  tags: ['full', 'accessibility', 'built-in'],
};

export const BUILT_IN_ACCESSIBILITY_PROFILES: ReadonlyArray<AccessibilityProfile> = [
  ACCESSIBILITY_DEFAULT,
  ACCESSIBILITY_HIGH_CONTRAST,
  ACCESSIBILITY_FULL,
];

// ─── Resolution Order ─────────────────────────────────────────────────────────

export const VISUAL_RESOLUTION_ORDER = [
  'platform',
  'tenant',
  'company',
  'user',
  'accessibility',
  'runtime',
] as const;
