import { ThemeProfileStub } from '../experience.types';

// ─── Layers / Sources ─────────────────────────────────────────────────────────

export type ThemeLayer =
  | 'platform'       // built-in platform default
  | 'tenant'         // tenant-wide theme
  | 'company'        // company-level override
  | 'user'           // individual user preference
  | 'runtime'        // programmatic override (A/B, feature flags)
  | 'accessibility'; // forced-colors, high-contrast OS override

// ─── Variants ─────────────────────────────────────────────────────────────────

export type ThemeKind =
  | 'light'
  | 'dark'
  | 'high-contrast'
  | 'custom'
  | 'tenant'
  | 'company'
  | 'user';

// ─── Design Tokens ────────────────────────────────────────────────────────────

export type TokenValue = string; // Any valid CSS value

export interface ThemeColorTokens {
  // Primaries
  readonly primary?:          TokenValue;
  readonly 'primary-dark'?:   TokenValue;
  readonly 'primary-light'?:  TokenValue;
  readonly 'primary-fg'?:     TokenValue;
  // Secondaries
  readonly secondary?:        TokenValue;
  readonly 'secondary-dark'?: TokenValue;
  readonly 'secondary-light'?: TokenValue;
  readonly 'secondary-fg'?:   TokenValue;
  // Semantics
  readonly success?:          TokenValue;
  readonly warning?:          TokenValue;
  readonly error?:            TokenValue;
  readonly info?:             TokenValue;
  // Surfaces
  readonly background?:       TokenValue;
  readonly surface?:          TokenValue;
  readonly 'surface-alt'?:    TokenValue;
  readonly 'surface-raised'?: TokenValue;
  // Text
  readonly 'text-primary'?:   TokenValue;
  readonly 'text-secondary'?: TokenValue;
  readonly 'text-disabled'?:  TokenValue;
  readonly 'text-inverse'?:   TokenValue;
  // Borders
  readonly border?:           TokenValue;
  readonly 'border-focus'?:   TokenValue;
  // Catch-all for custom tokens
  readonly [key: string]:     TokenValue | undefined;
}

export interface ThemeSpacingTokens {
  readonly '1'?:  TokenValue;
  readonly '2'?:  TokenValue;
  readonly '3'?:  TokenValue;
  readonly '4'?:  TokenValue;
  readonly '5'?:  TokenValue;
  readonly '6'?:  TokenValue;
  readonly '8'?:  TokenValue;
  readonly '10'?: TokenValue;
  readonly '12'?: TokenValue;
  readonly '16'?: TokenValue;
  readonly [key: string]: TokenValue | undefined;
}

export interface ThemeRadiusTokens {
  readonly none?:   TokenValue;
  readonly sm?:     TokenValue;
  readonly md?:     TokenValue;
  readonly lg?:     TokenValue;
  readonly xl?:     TokenValue;
  readonly full?:   TokenValue;
  readonly [key: string]: TokenValue | undefined;
}

export interface ThemeElevationTokens {
  readonly none?:   TokenValue;
  readonly xs?:     TokenValue;
  readonly sm?:     TokenValue;
  readonly md?:     TokenValue;
  readonly lg?:     TokenValue;
  readonly xl?:     TokenValue;
  readonly [key: string]: TokenValue | undefined;
}

export interface ThemeBreakpointTokens {
  readonly xs?:  TokenValue;
  readonly sm?:  TokenValue;
  readonly md?:  TokenValue;
  readonly lg?:  TokenValue;
  readonly xl?:  TokenValue;
  readonly xxl?: TokenValue;
  readonly [key: string]: TokenValue | undefined;
}

export interface ThemeTokens {
  readonly colors:      ThemeColorTokens;
  readonly spacing?:    ThemeSpacingTokens;
  readonly radius?:     ThemeRadiusTokens;
  readonly elevation?:  ThemeElevationTokens;
  readonly breakpoints?: ThemeBreakpointTokens;
  readonly custom?:     Readonly<Record<string, TokenValue>>;
}

// ─── Theme Definition ─────────────────────────────────────────────────────────

export interface ThemeDefinition extends ThemeProfileStub {
  readonly kind:       'theme';
  readonly variant:    ThemeKind;
  readonly tokens:     ThemeTokens;
  readonly parentId?:  string;    // Inherits from this theme first
  readonly provider?:  string;    // Plugin ID that registered this theme
  readonly tags?:      ReadonlyArray<string>;
}

// ─── Effective Theme (result of pipeline) ────────────────────────────────────

export interface ThemeLayerSnapshot {
  readonly layer:      ThemeLayer;
  readonly themeId:    string | null;
  readonly applied:    boolean;
  readonly tokenCount: number;
  readonly reason?:    string;
}

export interface EffectiveTheme {
  readonly id:          string;
  readonly name:        string;
  readonly variant:     ThemeKind;
  readonly tokens:      ThemeTokens;
  readonly layers:      ReadonlyArray<ThemeLayerSnapshot>;
  readonly resolvedAt:  string;
}

// ─── Theme Events ─────────────────────────────────────────────────────────────

export interface ThemeChangedEvent {
  readonly type:      'theme:changed';
  readonly themeId:   string | null;
  readonly prevId:    string | null;
  readonly effective: EffectiveTheme | null;
}

export interface ThemeLoadedEvent {
  readonly type:    'theme:loaded';
  readonly themeId: string;
  readonly source:  string;
}

export interface ThemeRegisteredEvent {
  readonly type:    'theme:registered';
  readonly themeId: string;
}

export interface ThemeResolvedEvent {
  readonly type:     'theme:resolved';
  readonly effective: EffectiveTheme;
}

export type ThemeEvent =
  | ThemeChangedEvent
  | ThemeLoadedEvent
  | ThemeRegisteredEvent
  | ThemeResolvedEvent;

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ThemeValidationResult {
  readonly valid:    boolean;
  readonly errors:   ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface ThemeLoadOptions {
  readonly force?: boolean;
  readonly timeout?: number;
}
