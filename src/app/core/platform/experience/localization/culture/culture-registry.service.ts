import { Injectable } from '@angular/core';
import { CultureDefinition } from './culture.types';
import { BUILT_IN_CULTURES, DEFAULT_CULTURE_CODE } from './culture.constants';

@Injectable({ providedIn: 'root' })
export class CultureRegistryService {
  private readonly _store = new Map<string, CultureDefinition>();
  private _defaultCode = DEFAULT_CULTURE_CODE;

  constructor() {
    this._registerBuiltIns();
  }

  // ─── Registration ─────────────────────────────────────────────────────────

  register(culture: CultureDefinition, options: { isDefault?: boolean } = {}): void {
    if (!culture.code?.trim()) {
      throw new Error(`CultureRegistry: culture.code is required.`);
    }
    this._store.set(culture.code, culture);
    if (options.isDefault) {
      this._defaultCode = culture.code;
    }
  }

  unregister(code: string): void {
    this._store.delete(code);
    if (this._defaultCode === code) {
      this._defaultCode = DEFAULT_CULTURE_CODE;
    }
  }

  // ─── Query ────────────────────────────────────────────────────────────────

  get(code: string): CultureDefinition | null {
    return this._store.get(code) ?? this._findByLanguage(code) ?? null;
  }

  has(code: string): boolean {
    return this._store.has(code);
  }

  all(): ReadonlyArray<CultureDefinition> {
    return Array.from(this._store.values());
  }

  byLanguage(lang: string): ReadonlyArray<CultureDefinition> {
    return this.all().filter(c => c.language === lang);
  }

  byRegion(region: string): ReadonlyArray<CultureDefinition> {
    return this.all().filter(c => c.region === region);
  }

  byTag(tag: string): ReadonlyArray<CultureDefinition> {
    return this.all().filter(c => c.tags?.includes(tag));
  }

  rtlCultures(): ReadonlyArray<CultureDefinition> {
    return this.all().filter(c => c.direction === 'rtl');
  }

  defaultCulture(): CultureDefinition | null {
    return this._store.get(this._defaultCode) ?? null;
  }

  count(): number {
    return this._store.size;
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _registerBuiltIns(): void {
    for (const c of BUILT_IN_CULTURES) {
      this._store.set(c.code, c);
    }
  }

  /** Finds the best match for a bare language code like 'en' → 'en-US' */
  private _findByLanguage(lang: string): CultureDefinition | undefined {
    if (lang.includes('-')) return undefined; // already a locale code, not found
    return Array.from(this._store.values()).find(c => c.language === lang);
  }
}
