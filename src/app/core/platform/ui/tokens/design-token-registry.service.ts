import { Injectable, signal, computed } from '@angular/core';
import { DesignToken, TokenCategory, TokenValue } from '../ui.types';

function toCssVar(key: string): string {
  return `--platform-${key.replace(/\./g, '-').replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;
}

@Injectable({ providedIn: 'root' })
export class DesignTokenRegistryService {
  private readonly _tokens = new Map<string, DesignToken>();
  private readonly _version = signal(0);

  readonly tokenCount = computed(() => {
    this._version();
    return this._tokens.size;
  });

  register(token: DesignToken): void {
    this._tokens.set(token.key, token);
    this._version.update(v => v + 1);
  }

  registerAll(tokens: ReadonlyArray<DesignToken>): void {
    for (const t of tokens) this._tokens.set(t.key, t);
    this._version.update(v => v + 1);
  }

  get(key: string): DesignToken | null {
    return this._tokens.get(key) ?? null;
  }

  getValue(key: string): TokenValue | null {
    return this._tokens.get(key)?.value ?? null;
  }

  getByCategory(category: TokenCategory): ReadonlyArray<DesignToken> {
    return Array.from(this._tokens.values()).filter(t => t.category === category);
  }

  getAll(): ReadonlyArray<DesignToken> {
    return Array.from(this._tokens.values());
  }

  has(key: string): boolean {
    return this._tokens.has(key);
  }

  remove(key: string): boolean {
    const existed = this._tokens.delete(key);
    if (existed) this._version.update(v => v + 1);
    return existed;
  }

  clear(): void {
    this._tokens.clear();
    this._version.update(v => v + 1);
  }

  toCssVarMap(): Readonly<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const t of this._tokens.values()) {
      out[t.cssVar] = String(t.value);
    }
    return out;
  }

  static buildToken(
    key: string,
    category: TokenCategory,
    value: TokenValue,
    description?: string,
  ): DesignToken {
    return { key, category, value, cssVar: toCssVar(key), description };
  }
}
