import { Signal } from '@angular/core';

// ─── Runtime State ────────────────────────────────────────────────────────────

export type RuntimeStatus = 'idle' | 'initializing' | 'ready' | 'error';

// ─── State Engine ─────────────────────────────────────────────────────────────

export interface StateSlice<T> {
  key: string;
  value: Signal<T>;
  set(value: T): void;
  update(fn: (current: T) => T): void;
  reset(): void;
}

// ─── Query Engine ─────────────────────────────────────────────────────────────

export interface QueryOptions {
  page?: number;
  size?: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: Record<string, unknown>;
  search?: string;
}

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  timestamp: string | null;
}

// ─── Cache Engine ─────────────────────────────────────────────────────────────

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
  hitCount: number;
}

export interface CacheOptions {
  ttlMs?: number;
  maxSize?: number;
}

// ─── Expression Engine ────────────────────────────────────────────────────────

export interface ExpressionContext {
  model: Record<string, unknown>;
  user?: Record<string, unknown>;
  env?: Record<string, unknown>;
}

// ─── Rule Engine ─────────────────────────────────────────────────────────────

export interface Rule {
  id: string;
  condition: string | ((ctx: ExpressionContext) => boolean);
  action: string | ((ctx: ExpressionContext) => void);
  priority?: number;
}

export interface RuleResult {
  ruleId: string;
  matched: boolean;
  actionExecuted: boolean;
  error?: string;
}

// ─── Formula Engine ──────────────────────────────────────────────────────────

export interface FormulaResult {
  formula: string;
  value: unknown;
  error?: string;
}

// ─── Data Provider ───────────────────────────────────────────────────────────

export interface DataProvider<T = unknown> {
  readonly name: string;
  getOne(id: string, options?: Record<string, unknown>): Promise<T>;
  getMany(options?: QueryOptions): Promise<PagedResult<T>>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// ─── Event Infrastructure ────────────────────────────────────────────────────

export interface PlatformEvent<T = unknown> {
  type: string;
  payload: T;
  source: string;
  timestamp: string;
  correlationId?: string;
}
