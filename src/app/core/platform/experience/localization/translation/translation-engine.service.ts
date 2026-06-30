import { Injectable, inject, computed, Signal, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import {
  TranslationMap, TranslationNamespace, TranslationValue,
  TranslationOptions, TranslationEvent, PluralTranslation,
} from './translation.types';
import { TranslationRegistryService } from './translation-registry.service';
import { TranslationLoaderService }   from './translation-loader.service';
import { TranslationCacheService }    from './translation-cache.service';
import { TranslationValidatorService } from './translation-validator.service';
import { TranslationSerializerService } from './translation-serializer.service';
import { ExperienceState }            from '../../experience-state';
import {
  TRANSLATION_DEFAULT_NAMESPACE,
  TRANSLATION_FALLBACK_LOCALE,
  TRANSLATION_INTERPOLATION_OPEN,
  TRANSLATION_INTERPOLATION_CLOSE,
} from './translation.tokens';
import {
  NAMESPACE_SEPARATOR, PLURAL_KEYS,
} from './translation.constants';

@Injectable({ providedIn: 'root' })
export class TranslationEngineService implements OnDestroy {
  // ─── Dependencies ────────────────────────────────────────────────────────

  private readonly _registry   = inject(TranslationRegistryService);
  private readonly _loader     = inject(TranslationLoaderService);
  private readonly _cache      = inject(TranslationCacheService);
  private readonly _validator  = inject(TranslationValidatorService);
  private readonly _serializer = inject(TranslationSerializerService);
  private readonly _state      = inject(ExperienceState);
  private readonly _defaultNs  = inject(TRANSLATION_DEFAULT_NAMESPACE);
  private readonly _fallbackLoc = inject(TRANSLATION_FALLBACK_LOCALE);
  private readonly _iOpen      = inject(TRANSLATION_INTERPOLATION_OPEN);
  private readonly _iClose     = inject(TRANSLATION_INTERPOLATION_CLOSE);

  // ─── Signals ─────────────────────────────────────────────────────────────

  readonly activeLocale:   Signal<string> = computed(() => this._state.localeCode());
  readonly activeLanguage: Signal<string> = computed(() => this._state.languageCode());

  // ─── Events ──────────────────────────────────────────────────────────────

  private readonly _events$ = new Subject<TranslationEvent>();
  readonly events$           = this._events$.asObservable();

  // ─── Pending loads (deduplication) ───────────────────────────────────────

  private readonly _pending = new Map<string, Promise<void>>();

  ngOnDestroy(): void {
    this._events$.complete();
  }

  // ─── Core Translation API ─────────────────────────────────────────────────

  /**
   * Translate a key synchronously.
   *
   * Key formats:
   *   'save'               → default namespace, key 'save'
   *   'forms:submit.label' → namespace 'forms', key 'submit.label'
   *   'errors.required'    → default namespace, key 'errors.required'
   *
   * Interpolation:  t('greeting', { params: { name: 'Ali' } })
   *   source: 'Hello, {{name}}!'
   *   result: 'Hello, Ali!'
   *
   * Pluralization:  t('items', { count: 3 })
   *   source: { one: '{{count}} item', other: '{{count}} items' }
   *   result: '3 items'
   */
  t(key: string, options?: TranslationOptions): string {
    const { namespace, resolvedKey } = this._parseKey(key, options?.namespace);
    const locale   = options?.locale ?? this.activeLocale();
    const fallback = options?.fallback ?? key;

    const raw = this._registry.resolve(namespace, resolvedKey, locale, undefined);

    if (raw === null) return fallback;

    // Pluralization
    if (options?.count !== undefined && this._isPluralObject(raw)) {
      return this._resolvePlural(raw as unknown as PluralTranslation, options.count, locale, options.params);
    }

    if (typeof raw !== 'string') return fallback;

    return this._interpolate(raw, options?.params);
  }

  /** Alias: same as t() but returns null instead of the key when not found. */
  translate(key: string, options?: TranslationOptions): string | null {
    const { namespace, resolvedKey } = this._parseKey(key, options?.namespace);
    const locale = options?.locale ?? this.activeLocale();
    const raw    = this._registry.resolve(namespace, resolvedKey, locale, undefined);
    if (raw === null) return null;
    if (options?.count !== undefined && this._isPluralObject(raw)) {
      return this._resolvePlural(raw as unknown as PluralTranslation, options.count, locale, options.params);
    }
    if (typeof raw !== 'string') return null;
    return this._interpolate(raw, options?.params);
  }

  /** Returns true if a key exists in the active locale. */
  has(key: string, locale?: string): boolean {
    const { namespace, resolvedKey } = this._parseKey(key);
    return this._registry.resolve(namespace, resolvedKey, locale ?? this.activeLocale(), undefined) !== null;
  }

  // ─── Namespace Registration ────────────────────────────────────────────────

  registerNamespace(ns: TranslationNamespace): void {
    const result = this._validator.validate(ns);
    if (!result.valid) {
      console.warn(`TranslationEngine: namespace "${ns.namespace}" has validation errors:`, result.errors);
    }
    this._registry.register(ns);
    this._events$.next({ type: 'translations:loaded', namespace: ns.namespace, locale: ns.locale, keyCount: result.keyCount });
  }

  /** Merge translations into an existing namespace (additive). */
  mergeNamespace(namespace: string, locale: string, data: TranslationMap): void {
    this._registry.merge(namespace, locale, data);
  }

  invalidateNamespace(namespace: string, locale?: string): void {
    this._registry.unregister(namespace, locale);
    this._cache.invalidate(namespace, locale);
    this._events$.next({ type: 'translations:invalidated', namespace, locale });
  }

  // ─── Lazy Loading ─────────────────────────────────────────────────────────

  async loadNamespace(namespace: string, locale?: string): Promise<void> {
    const l   = locale ?? this.activeLocale();
    const key = `${namespace}::${l}`;

    // Deduplicate in-flight loads
    const inflight = this._pending.get(key);
    if (inflight) return inflight;

    const p = this._doLoad(namespace, l, key);
    this._pending.set(key, p);
    return p;
  }

  async loadNamespaces(namespaces: ReadonlyArray<string>, locale?: string): Promise<void> {
    await Promise.all(namespaces.map(ns => this.loadNamespace(ns, locale)));
  }

  isLoaded(namespace: string, locale?: string): boolean {
    return this._registry.has(namespace, locale ?? this.activeLocale());
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  serializeNamespace(ns: TranslationNamespace): string {
    return this._serializer.serialize(ns);
  }

  deserializeNamespace(json: string): TranslationNamespace {
    return this._serializer.deserialize(json);
  }

  // ─── Registry Access ─────────────────────────────────────────────────────

  getMap(namespace: string, locale?: string): TranslationMap | null {
    return this._registry.getMap(namespace, locale ?? this.activeLocale());
  }

  namespaces(): ReadonlyArray<string> {
    return this._registry.namespaces();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async _doLoad(namespace: string, locale: string, key: string): Promise<void> {
    try {
      const result = await this._loader.load(namespace, locale);
      if (result.loaded) {
        const data = this._cache.get(namespace, locale);
        if (data) {
          this._registry.register({ namespace, locale, data });
          this._events$.next({
            type:      'translations:loaded',
            namespace,
            locale,
            keyCount:  Object.keys(data).length,
          });
        }
      }
    } finally {
      this._pending.delete(key);
    }
  }

  private _parseKey(key: string, explicitNs?: string): { namespace: string; resolvedKey: string } {
    if (explicitNs) return { namespace: explicitNs, resolvedKey: key };
    const sep = key.indexOf(NAMESPACE_SEPARATOR);
    if (sep > 0) {
      return { namespace: key.slice(0, sep), resolvedKey: key.slice(sep + 1) };
    }
    return { namespace: this._defaultNs, resolvedKey: key };
  }

  private _interpolate(
    template: string,
    params?: Readonly<Record<string, string | number | boolean>>,
  ): string {
    if (!params || !template.includes(this._iOpen)) return template;
    const open  = this._escapeRegex(this._iOpen);
    const close = this._escapeRegex(this._iClose);
    const re    = new RegExp(`${open}\\s*([\\w.]+)\\s*${close}`, 'g');
    return template.replace(re, (_, paramKey: string) => {
      const val = params[paramKey.trim()];
      return val !== undefined ? String(val) : `${this._iOpen}${paramKey}${this._iClose}`;
    });
  }

  private _resolvePlural(
    plural:  PluralTranslation,
    count:   number,
    locale:  string,
    params?: Readonly<Record<string, string | number | boolean>>,
  ): string {
    let category: string;
    try {
      category = new Intl.PluralRules(locale).select(count);
    } catch {
      category = 'other';
    }

    const value =
      (plural as unknown as Record<string, string | undefined>)[category] ??
      plural.other;

    return this._interpolate(value, { count, ...params });
  }

  private _isPluralObject(value: TranslationValue): boolean {
    if (typeof value !== 'object' || value === null) return false;
    const keys = Object.keys(value);
    return keys.length > 0 && keys.every(k => PLURAL_KEYS.has(k));
  }

  private _escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
