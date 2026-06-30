import { Injectable, inject } from '@angular/core';
import { ThemeDefinition, ThemeKind } from './theme.types';
import { ExperienceRegistryService }  from '../experience-registry.service';
import { ThemeValidatorService }      from './theme-validator.service';
import { BUILT_IN_THEMES, DEFAULT_PLATFORM_THEME_ID } from './theme.constants';

@Injectable({ providedIn: 'root' })
export class ThemeRegistryService {
  private readonly _registry  = inject(ExperienceRegistryService);
  private readonly _validator = inject(ThemeValidatorService);

  constructor() {
    this._registerBuiltIns();
  }

  // ─── Registration ─────────────────────────────────────────────────────────

  register(theme: ThemeDefinition, options: { isDefault?: boolean } = {}): void {
    const result = this._validator.validate(theme);
    if (!result.valid) {
      throw new Error(
        `ThemeRegistry: Cannot register theme "${theme.id}": ${result.errors.join('; ')}`,
      );
    }
    this._registry.register('theme', theme, {
      isDefault: options.isDefault,
      tags:      theme.tags ? [...theme.tags] : undefined,
    });
  }

  // ─── Query ────────────────────────────────────────────────────────────────

  get(themeId: string): ThemeDefinition | null {
    return this._registry.get('theme', themeId) as ThemeDefinition | null;
  }

  has(themeId: string): boolean {
    return this._registry.has('theme', themeId);
  }

  all(): ReadonlyArray<ThemeDefinition> {
    return this._registry.all('theme') as ReadonlyArray<ThemeDefinition>;
  }

  byKind(variant: ThemeKind): ReadonlyArray<ThemeDefinition> {
    return this.all().filter(t => t.variant === variant);
  }

  byTag(tag: string): ReadonlyArray<ThemeDefinition> {
    return this._registry.byTag('theme', tag) as ReadonlyArray<ThemeDefinition>;
  }

  defaultTheme(): ThemeDefinition | null {
    const def = this._registry.defaultFor('theme');
    return (def as ThemeDefinition | null) ?? this.get(DEFAULT_PLATFORM_THEME_ID);
  }

  count(): number {
    return this._registry.countByDimension()['theme'];
  }

  unregister(themeId: string): void {
    this._registry.unregister('theme', themeId);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _registerBuiltIns(): void {
    for (const theme of BUILT_IN_THEMES) {
      this._registry.register('theme', theme, {
        isDefault: theme.id === DEFAULT_PLATFORM_THEME_ID,
        tags:      theme.tags ? [...theme.tags] : undefined,
      });
    }
  }
}
