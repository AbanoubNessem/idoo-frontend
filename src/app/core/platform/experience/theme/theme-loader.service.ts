import { Injectable, inject } from '@angular/core';
import { ThemeDefinition, ThemeLoadOptions } from './theme.types';
import { ThemeCacheService }   from './theme-cache.service';
import { THEME_PROVIDERS }     from './theme.tokens';
import { ThemeProvider }       from './theme.tokens';

@Injectable({ providedIn: 'root' })
export class ThemeLoaderService {
  private readonly _cache      = inject(ThemeCacheService);
  private readonly _providers  = inject(THEME_PROVIDERS);
  private readonly _extraProviders: ThemeProvider[] = [];

  // ─── Public API ───────────────────────────────────────────────────────────

  registerProvider(provider: ThemeProvider): void {
    if (!this._extraProviders.find(p => p.id === provider.id)) {
      this._extraProviders.push(provider);
    }
  }

  unregisterProvider(providerId: string): void {
    const idx = this._extraProviders.findIndex(p => p.id === providerId);
    if (idx >= 0) this._extraProviders.splice(idx, 1);
  }

  async load(themeId: string, options: ThemeLoadOptions = {}): Promise<ThemeDefinition> {
    if (!options.force) {
      const cached = this._cache.get(themeId);
      if (cached) return cached;
    }

    const provider = this._findProvider(themeId);
    if (!provider) {
      throw new Error(`ThemeLoader: No provider can load theme "${themeId}".`);
    }

    const theme = await this._loadWithTimeout(provider, themeId, options.timeout ?? 10_000);
    this._cache.set(theme);
    return theme;
  }

  async loadMany(
    themeIds: ReadonlyArray<string>,
    options: ThemeLoadOptions = {},
  ): Promise<ReadonlyArray<ThemeDefinition>> {
    const results = await Promise.allSettled(themeIds.map(id => this.load(id, options)));
    return results
      .filter((r): r is PromiseFulfilledResult<ThemeDefinition> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  canLoad(themeId: string): boolean {
    return !!this._findProvider(themeId);
  }

  listAvailable(): Promise<ReadonlyArray<{ id: string; name: string; provider: string }>> {
    const all = [...this._providers, ...this._extraProviders];
    return Promise.all(
      all.filter(p => !!p.list).map(async p => {
        const items = await p.list!();
        return items.map(i => ({ ...i, provider: p.id }));
      }),
    ).then(nested => nested.flat());
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _findProvider(themeId: string): ThemeProvider | undefined {
    const all = [...this._providers, ...this._extraProviders];
    return all.find(p => p.canLoad(themeId));
  }

  private _loadWithTimeout(
    provider: ThemeProvider,
    themeId:  string,
    timeout:  number,
  ): Promise<ThemeDefinition> {
    return new Promise<ThemeDefinition>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`ThemeLoader: Loading theme "${themeId}" timed out after ${timeout}ms.`)),
        timeout,
      );
      provider.load(themeId).then(
        t  => { clearTimeout(timer); resolve(t); },
        e  => { clearTimeout(timer); reject(e);  },
      );
    });
  }
}
