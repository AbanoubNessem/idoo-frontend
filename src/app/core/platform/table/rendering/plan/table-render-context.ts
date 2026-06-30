import { computed, signal } from '@angular/core';
import { TableDensity } from '../../table.types';
import { TableRenderPlan, TableRenderState } from '../rendering.types';

// ─── TableRenderContext ───────────────────────────────────────────────────────
// Per-instance reactive state container for table rendering.
// Created once per rendered table; not injectable (use TableRendererService.createContext()).

export class TableRenderContext {
  private readonly _state    = signal<TableRenderState>('idle');
  private readonly _density  = signal<TableDensity>('default');
  private readonly _errorMsg = signal<string | null>(null);
  private readonly _plan     = signal<TableRenderPlan | null>(null);

  readonly state    = this._state.asReadonly();
  readonly density  = this._density.asReadonly();
  readonly errorMsg = this._errorMsg.asReadonly();
  readonly plan     = this._plan.asReadonly();

  readonly isIdle    = computed(() => this._state() === 'idle');
  readonly isLoading = computed(() => this._state() === 'loading');
  readonly isReady   = computed(() => this._state() === 'ready');
  readonly isEmpty   = computed(() => this._state() === 'empty');
  readonly isError   = computed(() => this._state() === 'error');
  readonly hasPlan   = computed(() => this._plan() !== null);

  setLoading(): void {
    this._state.set('loading');
    this._errorMsg.set(null);
  }

  setReady(plan: TableRenderPlan): void {
    this._plan.set(plan);
    this._density.set(plan.density);
    this._state.set('ready');
    this._errorMsg.set(null);
  }

  setEmpty(plan: TableRenderPlan): void {
    this._plan.set(plan);
    this._density.set(plan.density);
    this._state.set('empty');
    this._errorMsg.set(null);
  }

  setError(message: string): void {
    this._state.set('error');
    this._errorMsg.set(message);
  }

  setDensity(density: TableDensity): void {
    this._density.set(density);
  }

  reset(): void {
    this._state.set('idle');
    this._density.set('default');
    this._errorMsg.set(null);
    this._plan.set(null);
  }
}
