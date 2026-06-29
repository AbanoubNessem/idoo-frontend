import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Theme, ThemeMode } from '../ui.types';
import { ColorSystemService } from '../tokens/color-system.service';
import { SpacingSystemService } from '../tokens/spacing-system.service';
import { TypographySystemService } from '../tokens/typography-system.service';
import { DensitySystemService } from '../tokens/density-system.service';

@Injectable({ providedIn: 'root' })
export class ThemeEngineService {
  private readonly platformId   = inject(PLATFORM_ID);
  private readonly colorSystem  = inject(ColorSystemService);
  private readonly spacing      = inject(SpacingSystemService);
  private readonly typography   = inject(TypographySystemService);
  private readonly density      = inject(DensitySystemService);

  private _appliedThemeId: string | null = null;

  apply(theme: Theme, target: HTMLElement | null = null): Readonly<Record<string, string>> {
    const cssVars = this.buildCssVars(theme);

    if (isPlatformBrowser(this.platformId)) {
      const el = target ?? document.documentElement;
      for (const [prop, value] of Object.entries(cssVars)) {
        el.style.setProperty(prop, value);
      }
      // Toggle theme class on <html>
      this.applyThemeClass(theme, el);
    }

    this._appliedThemeId = theme.id;
    return cssVars;
  }

  remove(theme: Theme, target: HTMLElement | null = null): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = target ?? document.documentElement;
    const cssVars = this.buildCssVars(theme);
    for (const prop of Object.keys(cssVars)) {
      el.style.removeProperty(prop);
    }
    if (theme.cssClass) el.classList.remove(theme.cssClass);
    this._appliedThemeId = null;
  }

  buildCssVars(theme: Theme): Readonly<Record<string, string>> {
    const vars: Record<string, string> = {};

    // Base semantic colors from mode
    const baseColors = theme.mode === 'dark'
      ? this.colorSystem.getDarkSemanticTokens()
      : this.colorSystem.getLightSemanticTokens();

    for (const [key, val] of Object.entries(baseColors)) {
      vars[`--platform-color-${key}`] = val;
    }

    // Theme token overrides
    if (theme.tokens.colors) {
      for (const [key, val] of Object.entries(theme.tokens.colors)) {
        if (val !== undefined) vars[`--platform-color-${key}`] = val;
      }
    }
    if (theme.tokens.borderRadius) {
      for (const [key, val] of Object.entries(theme.tokens.borderRadius)) {
        if (val !== undefined) vars[`--platform-border-radius-${key}`] = val;
      }
    }
    if (theme.tokens.elevation) {
      for (const [key, val] of Object.entries(theme.tokens.elevation)) {
        if (val !== undefined) vars[`--platform-elevation-${key}`] = val;
      }
    }
    if (theme.tokens.spacing) {
      for (const [key, val] of Object.entries(theme.tokens.spacing)) {
        if (val !== undefined) vars[`--platform-spacing-${key}`] = val;
      }
    }
    if (theme.tokens.motion) {
      for (const [key, val] of Object.entries(theme.tokens.motion)) {
        if (val !== undefined) vars[`--platform-motion-${key}`] = val;
      }
    }

    // Density tokens
    const densityCfg = this.density.config();
    vars['--platform-density-multiplier']  = String(densityCfg.multiplier);
    vars['--platform-density-touch-target'] = `${densityCfg.touchTargetPx}px`;

    // Mode flag
    vars['--platform-theme-mode'] = theme.mode;

    return vars;
  }

  getAppliedThemeId(): string | null {
    return this._appliedThemeId;
  }

  prefersDark(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  preferredMode(): ThemeMode {
    return this.prefersDark() ? 'dark' : 'light';
  }

  private applyThemeClass(theme: Theme, el: HTMLElement): void {
    // Remove all platform theme classes, add the new one
    const toRemove = Array.from(el.classList).filter(c => c.startsWith('platform-theme-'));
    for (const cls of toRemove) el.classList.remove(cls);
    if (theme.cssClass) el.classList.add(theme.cssClass);
  }
}
