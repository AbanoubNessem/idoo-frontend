import { Injectable } from '@angular/core';
import { TranslationMap, TranslationNamespace, TranslationValue } from './translation.types';
import {
  DEFAULT_NAMESPACE, KEY_SEPARATOR, BUILT_IN_COMMON_EN, TRANSLATION_DEFAULT_FALLBACK,
} from './translation.constants';

@Injectable({ providedIn: 'root' })
export class TranslationRegistryService {
  /** Map<`namespace::locale`, TranslationMap> */
  private readonly _store = new Map<string, TranslationMap>();

  constructor() {
    this._registerBuiltIns();
  }

  // ─── Registration ─────────────────────────────────────────────────────────

  register(ns: TranslationNamespace): void {
    const key      = this._key(ns.namespace, ns.locale);
    const existing = this._store.get(key) ?? {};
    this._store.set(key, { ...existing, ...ns.data });
  }

  merge(namespace: string, locale: string, data: TranslationMap): void {
    const key      = this._key(namespace, locale);
    const existing = this._store.get(key) ?? {};
    this._store.set(key, this._deepMerge(existing, data));
  }

  unregister(namespace: string, locale?: string): void {
    if (locale) {
      this._store.delete(this._key(namespace, locale));
    } else {
      for (const k of Array.from(this._store.keys())) {
        if (k.startsWith(`${namespace}::`)) this._store.delete(k);
      }
    }
  }

  // ─── Resolution ───────────────────────────────────────────────────────────

  resolve(
    namespace: string,
    key:       string,
    locale:    string,
    fallback?: string,
  ): TranslationValue | null {
    // 1. Exact locale
    let value = this._lookup(namespace, locale, key);
    if (value !== null) return value;

    // 2. Language fallback ('en-US' → 'en')
    const lang = locale.split('-')[0];
    if (lang !== locale) {
      value = this._lookup(namespace, lang, key);
      if (value !== null) return value;
    }

    // 3. platform default fallback
    if (locale !== TRANSLATION_DEFAULT_FALLBACK && lang !== TRANSLATION_DEFAULT_FALLBACK.split('-')[0]) {
      value = this._lookup(namespace, TRANSLATION_DEFAULT_FALLBACK, key);
      if (value !== null) return value;
    }

    return fallback ?? null;
  }

  getMap(namespace: string, locale: string): TranslationMap | null {
    return this._store.get(this._key(namespace, locale)) ?? null;
  }

  has(namespace: string, locale: string): boolean {
    return this._store.has(this._key(namespace, locale));
  }

  namespaces(): ReadonlyArray<string> {
    const ns = new Set<string>();
    for (const k of this._store.keys()) {
      ns.add(k.split('::')[0]);
    }
    return Array.from(ns);
  }

  localesForNamespace(namespace: string): ReadonlyArray<string> {
    const locales: string[] = [];
    for (const k of this._store.keys()) {
      const [ns, loc] = k.split('::');
      if (ns === namespace) locales.push(loc);
    }
    return locales;
  }

  clear(): void {
    this._store.clear();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _lookup(namespace: string, locale: string, key: string): TranslationValue | null {
    const map = this._store.get(this._key(namespace, locale));
    if (!map) return null;
    return this._traverseKey(map, key.split(KEY_SEPARATOR));
  }

  private _traverseKey(node: TranslationMap, parts: string[]): TranslationValue | null {
    let current: TranslationValue = node;
    for (const part of parts) {
      if (typeof current !== 'object' || current === null) return null;
      const next: TranslationValue | undefined = (current as Record<string, TranslationValue>)[part];
      if (next === undefined) return null;
      current = next;
    }
    return current;
  }

  private _deepMerge(base: TranslationMap, override: TranslationMap): TranslationMap {
    const result: TranslationMap = { ...base };
    for (const [k, v] of Object.entries(override)) {
      if (typeof v === 'object' && typeof result[k] === 'object') {
        result[k] = this._deepMerge(result[k] as TranslationMap, v as TranslationMap);
      } else {
        result[k] = v;
      }
    }
    return result;
  }

  private _key(namespace: string, locale: string): string {
    return `${namespace}::${locale}`;
  }

  private _registerBuiltIns(): void {
    this._store.set(`${DEFAULT_NAMESPACE}::en-US`, { ...BUILT_IN_COMMON_EN });
    this._store.set(`${DEFAULT_NAMESPACE}::en`,    { ...BUILT_IN_COMMON_EN });
  }
}
