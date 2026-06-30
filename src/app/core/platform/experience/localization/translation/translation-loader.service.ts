import { Injectable, inject } from '@angular/core';
import { TranslationMap, TranslationLoadOptions, TranslationLoadResult } from './translation.types';
import { TranslationCacheService }  from './translation-cache.service';
import { TRANSLATION_PROVIDERS, TranslationProvider } from './translation.tokens';

@Injectable({ providedIn: 'root' })
export class TranslationLoaderService {
  private readonly _cache          = inject(TranslationCacheService);
  private readonly _providers      = inject(TRANSLATION_PROVIDERS);
  private readonly _extraProviders: TranslationProvider[] = [];

  // ─── Provider Management ─────────────────────────────────────────────────

  registerProvider(provider: TranslationProvider): void {
    if (!this._extraProviders.find(p => p.id === provider.id)) {
      this._extraProviders.push(provider);
    }
  }

  unregisterProvider(providerId: string): void {
    const idx = this._extraProviders.findIndex(p => p.id === providerId);
    if (idx >= 0) this._extraProviders.splice(idx, 1);
  }

  // ─── Loading ─────────────────────────────────────────────────────────────

  async load(
    namespace: string,
    locale:    string,
    options:   TranslationLoadOptions = {},
  ): Promise<TranslationLoadResult> {
    const start = performance.now();

    if (!options.force) {
      const cached = this._cache.get(namespace, locale);
      if (cached) {
        return { namespace, locale, loaded: true, source: 'cache', duration: 0 };
      }
    }

    const provider = this._findProvider(namespace, locale);
    if (!provider) {
      // Try language-only fallback: 'en-US' → 'en'
      const lang          = locale.split('-')[0];
      const langProvider  = lang !== locale ? this._findProvider(namespace, lang) : null;
      if (!langProvider) {
        return {
          namespace, locale, loaded: false,
          source:   'none',
          duration: performance.now() - start,
          error:    `No provider for namespace "${namespace}" + locale "${locale}".`,
        };
      }
      const data = await this._loadWithTimeout(langProvider, namespace, lang, options.timeout);
      this._cache.set(namespace, locale, data);
      return { namespace, locale, loaded: true, source: langProvider.id, duration: performance.now() - start };
    }

    try {
      const data = await this._loadWithTimeout(provider, namespace, locale, options.timeout);
      this._cache.set(namespace, locale, data);
      return { namespace, locale, loaded: true, source: provider.id, duration: performance.now() - start };
    } catch (err) {
      return {
        namespace, locale, loaded: false,
        source:   provider.id,
        duration: performance.now() - start,
        error:    String(err),
      };
    }
  }

  async loadMany(
    namespaces: ReadonlyArray<string>,
    locale:     string,
    options:    TranslationLoadOptions = {},
  ): Promise<ReadonlyArray<TranslationLoadResult>> {
    return Promise.all(namespaces.map(ns => this.load(ns, locale, options)));
  }

  canLoad(namespace: string, locale: string): boolean {
    return !!this._findProvider(namespace, locale);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _findProvider(namespace: string, locale: string): TranslationProvider | undefined {
    const all = [...this._providers, ...this._extraProviders];
    return all.find(p => p.canLoad(namespace, locale));
  }

  private _loadWithTimeout(
    provider:   TranslationProvider,
    namespace:  string,
    locale:     string,
    timeoutMs = 10_000,
  ): Promise<TranslationMap> {
    return new Promise<TranslationMap>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`TranslationLoader: Loading "${namespace}/${locale}" timed out after ${timeoutMs}ms.`)),
        timeoutMs,
      );
      provider.load(namespace, locale).then(
        d => { clearTimeout(timer); resolve(d); },
        e => { clearTimeout(timer); reject(e);  },
      );
    });
  }
}
