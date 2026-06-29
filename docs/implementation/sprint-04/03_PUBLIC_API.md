# Sprint 4 — Public API Reference

**Module:** `src/app/core/platform/ui/`  
**Barrel:** `index.ts`

---

## UIContextService — Primary Entry Point

```typescript
class UIContextService {
  // Signals
  readonly themeState:    Signal<ThemeState>;
  readonly viewportState: Signal<ViewportState>;
  readonly densityConfig: Signal<DensityConfig>;
  readonly a11yState:     Signal<A11yState>;
  readonly motionConfig:  Signal<MotionConfig>;
  readonly isDark:        Signal<boolean>;
  readonly isMobile:      Signal<boolean>;
  readonly isTablet:      Signal<boolean>;
  readonly isDesktop:     Signal<boolean>;
  readonly reducedMotion: Signal<boolean>;
  readonly highContrast:  Signal<boolean>;
  readonly snapshot:      Signal<UIContextSnapshot>;

  initialize(options?: {
    themeId?: string;
    density?: DensityLevel;
    useSystemTheme?: boolean;
  }): void;
}
```

### Usage
```typescript
const ctx = inject(UIContextService);
ctx.initialize({ themeId: 'light', density: 'comfortable' });

// In template:
// [class.dark]="ctx.isDark()"
// [class.mobile]="ctx.isMobile()"
```

---

## ThemeManagerService

```typescript
class ThemeManagerService {
  readonly activeThemeId: Signal<string>;
  readonly activeMode:    Signal<ThemeMode>;
  readonly isDark:        Signal<boolean>;
  readonly themeState:    Signal<ThemeState>;

  initialize(defaultThemeId?: string): void;
  setTheme(id: string): void;
  setMode(mode: ThemeMode): void;
  toggleMode(): void;
  useSystemPreference(): void;
  registerAndApply(theme: Theme): void;
  activeTheme(): Theme | null;
}
```

---

## DesignTokenRegistryService

```typescript
class DesignTokenRegistryService {
  readonly tokenCount: Signal<number>;

  register(token: DesignToken): void;
  registerAll(tokens: ReadonlyArray<DesignToken>): void;
  get(key: string): DesignToken | null;
  getValue(key: string): TokenValue | null;
  getByCategory(category: TokenCategory): ReadonlyArray<DesignToken>;
  getAll(): ReadonlyArray<DesignToken>;
  has(key: string): boolean;
  remove(key: string): boolean;
  clear(): void;
  toCssVarMap(): Readonly<Record<string, string>>;

  static buildToken(key, category, value, description?): DesignToken;
}
```

---

## IconRegistryService

```typescript
class IconRegistryService {
  readonly iconCount: Signal<number>;

  register(icon: IconDefinition): void;
  registerAll(icons: ReadonlyArray<IconDefinition>): void;
  get(name: string, variant?: IconVariant): IconDefinition | null;
  getSvg(name: string, variant?: IconVariant): string | null;
  has(name: string, variant?: IconVariant): boolean;
  search(query: string): ReadonlyArray<IconDefinition>;
  getByVariant(variant: IconVariant): ReadonlyArray<IconDefinition>;
  remove(name: string, variant?: IconVariant): boolean;
  clear(): void;
}
```

---

## DialogHostService

```typescript
class DialogHostService {
  readonly openDialogs:   Signal<ReadonlyArray<string>>;
  readonly dialogCount:   Signal<number>;
  readonly hasOpenDialog: Signal<boolean>;

  open<T, D, R>(component: Type<T>, config?: DialogConfig<D>): OverlayRef<R>;
  closeAll(): void;
  isOpen(id: string): boolean;
}

// Usage:
const dialog = inject(DialogHostService);
const ref = dialog.open(MyDialogComponent, { size: 'md', data: { id: 42 } });
ref.afterClosed().then(result => console.log(result));
```

---

## AccessibilityService

```typescript
class AccessibilityService {
  readonly a11yState:     Signal<A11yState>;
  readonly reducedMotion: Signal<boolean>;
  readonly highContrast:  Signal<boolean>;

  initialize(): void;
  announce(message: string, politeness?: AnnouncePoliteness): Promise<void>;
  announceError(message: string): Promise<void>;
  clearAnnouncement(): void;
  setAriaLabel(el, label): void;
  setAriaRole(el, role): void;
  setAriaExpanded(el, expanded): void;
  setAriaHidden(el, hidden): void;
  setAriaCurrent(el, current): void;
  createSkipLink(targetId, label?): HTMLAnchorElement | null;
}
```

---

## MotionEngineService

```typescript
class MotionEngineService {
  readonly config:         Signal<MotionConfig>;
  readonly reducedMotion:  Signal<boolean>;

  initialize(): void;
  play(el: HTMLElement, nameOrSpec: string | AnimationSpec, overrides?): AnimationHandle;
  playNamed(el: HTMLElement, name: string): AnimationHandle;
  cancelAll(): void;
  setDurationMultiplier(multiplier: number): void;
  setReducedMotion(value: boolean): void;
}

interface AnimationHandle {
  id: string;
  name: string;
  cancel(): void;
  finish(): Promise<void>;
}
```

---

## Key Types

```typescript
type ThemeMode    = 'light' | 'dark';
type DensityLevel = 'spacious' | 'comfortable' | 'compact';
type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type DeviceClass   = 'mobile' | 'tablet' | 'desktop';
type DialogSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
type DrawerPosition = 'start' | 'end' | 'top' | 'bottom';
type AnimationDuration = 'instant' | 'fast' | 'medium' | 'slow' | 'very-slow';
type EasingFunction = 'linear' | 'ease' | 'standard' | 'decelerate' | 'accelerate' | ...;
type LayoutPreset  = 'grid' | 'flex' | 'stack' | 'section' | 'container' | 'card' | 'panel' | 'split';
type TypeScale     = 'display-large' | ... | 'label-small'; // 15 values
```
