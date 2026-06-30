// ─── Resolution ───────────────────────────────────────────────────────────────

export type VisualLayer =
  | 'platform'
  | 'tenant'
  | 'company'
  | 'user'
  | 'accessibility'
  | 'runtime';

export interface VisualLayerSnapshot {
  readonly layer:   VisualLayer;
  readonly id:      string | null;
  readonly applied: boolean;
  readonly reason?: string;
}

// ─── Typography ───────────────────────────────────────────────────────────────

export interface TypographyScale {
  readonly xs?:    string; // '10px'
  readonly sm?:    string; // '12px'
  readonly base:   string; // '14px'
  readonly lg?:    string; // '16px'
  readonly xl?:    string; // '20px'
  readonly '2xl'?: string; // '24px'
  readonly '3xl'?: string; // '30px'
  readonly '4xl'?: string; // '36px'
}

export interface TypographyWeights {
  readonly light?:    string; // '300'
  readonly normal:    string; // '400'
  readonly medium:    string; // '500'
  readonly semibold?: string; // '600'
  readonly bold:      string; // '700'
}

export interface TypographyLineHeights {
  readonly tight:   string; // '1.25'
  readonly normal:  string; // '1.5'
  readonly relaxed: string; // '1.75'
}

export interface TypographyLetterSpacing {
  readonly tight?:  string; // '-0.025em'
  readonly normal?: string; // '0'
  readonly wide?:   string; // '0.025em'
}

export interface TypographyProfile {
  readonly id:                string;
  readonly name:              string;
  readonly description?:      string;
  readonly fontFamilyBase:    string;   // Latin / default
  readonly fontFamilyArabic?: string;   // Arabic / RTL
  readonly fontFamilyMono?:   string;   // Mono / code
  readonly scale:             TypographyScale;
  readonly weights:           TypographyWeights;
  readonly lineHeights:       TypographyLineHeights;
  readonly letterSpacing?:    TypographyLetterSpacing;
  readonly tags?:             ReadonlyArray<string>;
}

// ─── Density ──────────────────────────────────────────────────────────────────

export type DensityLevel = 'compact' | 'comfortable' | 'spacious';

export interface DensityProfile {
  readonly id:          string;
  readonly name:        string;
  readonly level:       DensityLevel;
  readonly description?: string;
  // Component heights
  readonly heightSm:    string; // button/input small
  readonly heightMd:    string; // button/input medium (default)
  readonly heightLg:    string; // button/input large
  // Padding
  readonly paddingXs:   string;
  readonly paddingSm:   string;
  readonly paddingMd:   string;
  readonly paddingLg:   string;
  // Gap / spacing
  readonly gapSm:       string;
  readonly gapMd:       string;
  readonly gapLg:       string;
  readonly tags?:       ReadonlyArray<string>;
}

// ─── Icon Pack ────────────────────────────────────────────────────────────────

export type IconPackType =
  | 'material-symbols'
  | 'heroicons'
  | 'font-awesome'
  | 'svg-sprite'
  | 'custom';

export interface IconPackProfile {
  readonly id:          string;
  readonly name:        string;
  readonly type:        IconPackType;
  readonly prefix?:     string;                    // CSS class prefix
  readonly cdnUrl?:     string;                    // CDN link href
  readonly spriteUrl?:  string;                    // SVG sprite URL
  readonly icons?:      Readonly<Record<string, string>>; // name → SVG/ligature
  readonly description?: string;
  readonly tags?:       ReadonlyArray<string>;
}

// ─── Motion ───────────────────────────────────────────────────────────────────

export interface MotionProfile {
  readonly id:               string;
  readonly name:             string;
  readonly reducedMotion:    boolean;
  readonly durationScale:    number;   // 0=none, 1=normal, 2=slow
  readonly durationFast:     string;   // '100ms'
  readonly durationNormal:   string;   // '200ms'
  readonly durationSlow:     string;   // '300ms'
  readonly easingStandard:   string;
  readonly easingDecelerate: string;
  readonly easingAccelerate: string;
  readonly tags?:            ReadonlyArray<string>;
}

// ─── Accessibility ────────────────────────────────────────────────────────────

export interface AccessibilityProfile {
  readonly id:             string;
  readonly name:           string;
  readonly highContrast:   boolean;
  readonly reducedMotion:  boolean;
  readonly largeTypography: boolean;
  readonly focusVisible:   boolean;
  readonly tags?:          ReadonlyArray<string>;
}

// ─── Effective Visual Experience ─────────────────────────────────────────────

export interface EffectiveVisualExperience {
  readonly typography:    TypographyProfile;
  readonly density:       DensityProfile;
  readonly iconPack:      IconPackProfile;
  readonly motion:        MotionProfile;
  readonly accessibility: AccessibilityProfile;
  readonly layers: {
    readonly typography:    ReadonlyArray<VisualLayerSnapshot>;
    readonly density:       ReadonlyArray<VisualLayerSnapshot>;
    readonly iconPack:      ReadonlyArray<VisualLayerSnapshot>;
    readonly motion:        ReadonlyArray<VisualLayerSnapshot>;
    readonly accessibility: ReadonlyArray<VisualLayerSnapshot>;
  };
  readonly resolvedAt: string;
}

// ─── Resolution Input ─────────────────────────────────────────────────────────

export interface VisualResolutionInput {
  readonly typographyByLayer?:    Partial<Record<VisualLayer, string>>;
  readonly densityByLayer?:       Partial<Record<VisualLayer, string>>;
  readonly iconPackByLayer?:      Partial<Record<VisualLayer, string>>;
  readonly motionByLayer?:        Partial<Record<VisualLayer, string>>;
  readonly accessibilityByLayer?: Partial<Record<VisualLayer, string>>;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface TypographyChangedEvent {
  readonly type:    'typography:changed';
  readonly id:      string | null;
  readonly prev:    string | null;
}

export interface DensityChangedEvent {
  readonly type:    'density:changed';
  readonly id:      string;
  readonly prev:    string;
}

export interface IconPackChangedEvent {
  readonly type:    'icon-pack:changed';
  readonly id:      string;
  readonly prev:    string;
}

export interface MotionChangedEvent {
  readonly type:    'motion:changed';
  readonly id:      string;
  readonly prev:    string;
}

export interface AccessibilityChangedEvent {
  readonly type:    'accessibility:changed';
  readonly profile: AccessibilityProfile;
  readonly prev:    AccessibilityProfile;
}

export type VisualEvent =
  | TypographyChangedEvent
  | DensityChangedEvent
  | IconPackChangedEvent
  | MotionChangedEvent
  | AccessibilityChangedEvent;

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface VisualMetricsSnapshot {
  readonly applyCount:           number;
  readonly changeByDimension:    Readonly<Record<VisualDimension, number>>;
  readonly lastApplyMs:          number;
  readonly errorCount:           number;
  readonly initializedAt:        string;
}

export type VisualDimension = 'typography' | 'density' | 'icon-pack' | 'motion' | 'accessibility';

// ─── Diagnostics ──────────────────────────────────────────────────────────────

export interface VisualDiagnosticsReport {
  readonly registeredProfiles: Readonly<Record<VisualDimension, number>>;
  readonly activeIds: {
    readonly typographyId:    string | null;
    readonly densityId:       string;
    readonly iconPackId:      string;
    readonly motionId:        string;
    readonly accessibilityId: string;
  };
  readonly accessibility: {
    readonly reducedMotion:   boolean;
    readonly largeTypography: boolean;
    readonly focusVisible:    boolean;
  };
  readonly metrics:       VisualMetricsSnapshot;
  readonly generatedAt:   string;
}
