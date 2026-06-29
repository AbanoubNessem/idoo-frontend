import { Type } from '@angular/core';

// ─── Design Token Types ───────────────────────────────────────────────────────

export type TokenCategory =
  | 'color' | 'typography' | 'spacing' | 'border-radius' | 'elevation'
  | 'opacity' | 'motion' | 'animation' | 'icon' | 'density' | 'breakpoint';

export type TokenValue = string | number;

export interface DesignToken {
  readonly key: string;
  readonly category: TokenCategory;
  readonly value: TokenValue;
  readonly cssVar: string;
  readonly description?: string;
}

export interface TokenSet {
  readonly [key: string]: TokenValue;
}

// ─── Color Types ──────────────────────────────────────────────────────────────

export type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export interface ColorPalette {
  readonly name: string;
  readonly shades: Partial<Record<ColorScale, string>>;
}

export type SemanticColor =
  | 'primary' | 'secondary' | 'accent'
  | 'success' | 'warning' | 'error' | 'info'
  | 'surface' | 'background' | 'on-surface' | 'on-background'
  | 'border' | 'divider' | 'shadow'
  | 'text-primary' | 'text-secondary' | 'text-disabled' | 'text-inverse';

export interface ColorTokenMap {
  readonly [semantic: string]: string;
}

// ─── Typography Types ─────────────────────────────────────────────────────────

export type TypeScale =
  | 'display-large' | 'display-medium' | 'display-small'
  | 'headline-large' | 'headline-medium' | 'headline-small'
  | 'title-large' | 'title-medium' | 'title-small'
  | 'body-large' | 'body-medium' | 'body-small'
  | 'label-large' | 'label-medium' | 'label-small';

export interface TypographySpec {
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly fontWeight: number;
  readonly lineHeight: string;
  readonly letterSpacing: string;
}

export type TypographyTokenMap = Partial<Record<TypeScale, TypographySpec>>;

// ─── Spacing Types ────────────────────────────────────────────────────────────

export type SpacingScale = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 14 | 16 | 20 | 24 | 32;

export interface SpacingToken {
  readonly scale: SpacingScale;
  readonly px: number;
  readonly rem: string;
}

// ─── Density Types ────────────────────────────────────────────────────────────

export type DensityLevel = 'spacious' | 'comfortable' | 'compact';

export interface DensityConfig {
  readonly level: DensityLevel;
  readonly multiplier: number;
  readonly baseSpacingPx: number;
  readonly touchTargetPx: number;
}

// ─── Theme Types ──────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark';

export interface ThemeTokenOverrides {
  readonly colors?: Partial<ColorTokenMap>;
  readonly typography?: Partial<Record<string, string>>;
  readonly spacing?: Partial<Record<string, string>>;
  readonly borderRadius?: Partial<Record<string, string>>;
  readonly elevation?: Partial<Record<string, string>>;
  readonly motion?: Partial<Record<string, string>>;
}

export interface Theme {
  readonly id: string;
  readonly name: string;
  readonly mode: ThemeMode;
  readonly tokens: ThemeTokenOverrides;
  readonly cssClass?: string;
}

export interface ThemeState {
  readonly activeThemeId: string;
  readonly mode: ThemeMode;
  readonly cssVars: Readonly<Record<string, string>>;
  readonly appliedAt: string;
}

// ─── Icon Types ───────────────────────────────────────────────────────────────

export type IconVariant = 'filled' | 'outlined' | 'rounded' | 'sharp';

export interface IconDefinition {
  readonly name: string;
  readonly svg: string;
  readonly variant: IconVariant;
  readonly tags?: ReadonlyArray<string>;
}

// ─── Breakpoint Types ─────────────────────────────────────────────────────────

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointDefinition {
  readonly key: BreakpointKey;
  readonly minWidthPx: number;
  readonly maxWidthPx: number | null;
  readonly mediaQuery: string;
}

export type DeviceClass = 'mobile' | 'tablet' | 'desktop';

export interface ViewportState {
  readonly breakpoint: BreakpointKey;
  readonly device: DeviceClass;
  readonly widthPx: number;
  readonly isPortrait: boolean;
  readonly isLandscape: boolean;
}

// ─── Layout Types ─────────────────────────────────────────────────────────────

export type LayoutPreset =
  | 'grid' | 'flex' | 'stack' | 'section' | 'container' | 'card' | 'panel' | 'split';

export type GridColumns = 1 | 2 | 3 | 4 | 6 | 12;
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type AlignItems = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type JustifyContent = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type GapSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LayoutConfig {
  readonly preset: LayoutPreset;
  readonly columns?: GridColumns;
  readonly direction?: FlexDirection;
  readonly align?: AlignItems;
  readonly justify?: JustifyContent;
  readonly gap?: GapSize;
  readonly wrap?: boolean;
  readonly padding?: GapSize;
  readonly maxWidth?: string;
  readonly responsive?: Partial<Record<BreakpointKey, Partial<LayoutConfig>>>;
}

// ─── Overlay Types ────────────────────────────────────────────────────────────

export type OverlayType = 'dialog' | 'drawer' | 'popover' | 'tooltip' | 'context-menu';

export type DrawerPosition = 'start' | 'end' | 'top' | 'bottom';
export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

export interface OverlayConfig {
  readonly id?: string;
  readonly hasBackdrop?: boolean;
  readonly backdropClass?: string;
  readonly panelClass?: string | string[];
  readonly width?: string | number;
  readonly height?: string | number;
  readonly minWidth?: string | number;
  readonly maxWidth?: string | number;
  readonly closeOnBackdropClick?: boolean;
  readonly closeOnEscape?: boolean;
  readonly restoreFocus?: boolean;
}

export interface DialogConfig<D = unknown> extends OverlayConfig {
  readonly data?: D;
  readonly size?: DialogSize;
  readonly title?: string;
  readonly disableClose?: boolean;
}

export interface DrawerConfig<D = unknown> extends OverlayConfig {
  readonly data?: D;
  readonly position?: DrawerPosition;
  readonly mode?: 'over' | 'push' | 'side';
}

export interface PopoverConfig extends OverlayConfig {
  readonly offsetX?: number;
  readonly offsetY?: number;
  readonly preferredPosition?: 'above' | 'below' | 'before' | 'after';
}

export interface TooltipConfig {
  readonly message: string;
  readonly position?: 'above' | 'below' | 'before' | 'after';
  readonly showDelay?: number;
  readonly hideDelay?: number;
}

export interface OverlayRef<R = unknown> {
  readonly id: string;
  readonly type: OverlayType;
  close(result?: R): void;
  afterClosed(): Promise<R | undefined>;
}

// ─── Accessibility Types ──────────────────────────────────────────────────────

export type AriaRole =
  | 'alert' | 'alertdialog' | 'banner' | 'button' | 'cell' | 'checkbox'
  | 'columnheader' | 'combobox' | 'complementary' | 'contentinfo' | 'definition'
  | 'dialog' | 'directory' | 'document' | 'feed' | 'figure' | 'form' | 'grid'
  | 'gridcell' | 'group' | 'heading' | 'img' | 'link' | 'list' | 'listbox'
  | 'listitem' | 'log' | 'main' | 'marquee' | 'math' | 'menu' | 'menubar'
  | 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | 'navigation' | 'none'
  | 'note' | 'option' | 'presentation' | 'progressbar' | 'radio' | 'radiogroup'
  | 'region' | 'row' | 'rowgroup' | 'rowheader' | 'scrollbar' | 'search'
  | 'searchbox' | 'separator' | 'slider' | 'spinbutton' | 'status' | 'switch'
  | 'tab' | 'table' | 'tablist' | 'tabpanel' | 'term' | 'textbox' | 'timer'
  | 'toolbar' | 'tooltip' | 'tree' | 'treegrid' | 'treeitem';

export type AnnouncePoliteness = 'polite' | 'assertive' | 'off';

export interface A11yState {
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly forcedColors: boolean;
  readonly screenReader: boolean;
}

export interface KeyboardShortcut {
  readonly key: string;
  readonly modifiers?: ReadonlyArray<'ctrl' | 'alt' | 'shift' | 'meta'>;
  readonly description: string;
  readonly action: () => void;
}

// ─── Motion / Animation Types ─────────────────────────────────────────────────

export type EasingFunction =
  | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'standard' | 'decelerate' | 'accelerate' | 'sharp';

export type AnimationDuration = 'instant' | 'fast' | 'medium' | 'slow' | 'very-slow';

export interface AnimationSpec {
  readonly name: string;
  readonly duration: AnimationDuration | number;
  readonly easing: EasingFunction;
  readonly keyframes: Keyframe[];
  readonly options?: KeyframeAnimationOptions;
}

export interface MotionConfig {
  readonly reducedMotion: boolean;
  readonly durationMultiplier: number;
  readonly defaultDuration: AnimationDuration;
  readonly defaultEasing: EasingFunction;
}

export interface AnimationHandle {
  readonly id: string;
  readonly name: string;
  cancel(): void;
  finish(): Promise<void>;
}

// ─── UIContext Types ──────────────────────────────────────────────────────────

export interface UIContextSnapshot {
  readonly theme: ThemeState;
  readonly viewport: ViewportState;
  readonly density: DensityConfig;
  readonly a11y: A11yState;
  readonly motion: MotionConfig;
  readonly generatedAt: string;
}
