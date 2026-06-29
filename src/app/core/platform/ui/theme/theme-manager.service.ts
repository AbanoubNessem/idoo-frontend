import { Injectable, inject, signal, computed } from '@angular/core';
import { Theme, ThemeMode, ThemeState } from '../ui.types';
import { ThemeRegistryService } from './theme-registry.service';
import { ThemeEngineService } from './theme-engine.service';

@Injectable({ providedIn: 'root' })
export class ThemeManagerService {
  private readonly registry = inject(ThemeRegistryService);
  private readonly engine   = inject(ThemeEngineService);

  private readonly _activeThemeId = signal<string>('light');
  private readonly _cssVars       = signal<Readonly<Record<string, string>>>({});

  readonly activeThemeId = computed(() => this._activeThemeId());
  readonly activeMode    = computed(() => this.activeTheme()?.mode ?? 'light');
  readonly isDark        = computed(() => this.activeMode() === 'dark');

  readonly themeState = computed<ThemeState>(() => ({
    activeThemeId: this._activeThemeId(),
    mode:          this.activeMode(),
    cssVars:       this._cssVars(),
    appliedAt:     new Date().toISOString(),
  }));

  activeTheme(): Theme | null {
    return this.registry.get(this._activeThemeId());
  }

  setTheme(id: string): void {
    const theme = this.registry.get(id);
    if (!theme) throw new Error(`ThemeManager: unknown theme "${id}"`);
    const cssVars = this.engine.apply(theme);
    this._activeThemeId.set(id);
    this._cssVars.set(cssVars);
  }

  setMode(mode: ThemeMode): void {
    const themes = this.registry.getByMode(mode);
    if (themes.length === 0) throw new Error(`ThemeManager: no theme found for mode "${mode}"`);
    this.setTheme(themes[0].id);
  }

  toggleMode(): void {
    this.setMode(this.activeMode() === 'light' ? 'dark' : 'light');
  }

  useSystemPreference(): void {
    const preferred = this.engine.preferredMode();
    this.setMode(preferred);
  }

  registerAndApply(theme: Theme): void {
    this.registry.register(theme);
    this.setTheme(theme.id);
  }

  initialize(defaultThemeId = 'light'): void {
    this.setTheme(defaultThemeId);
  }
}
