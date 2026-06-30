import { InjectionToken } from '@angular/core';
import { LayoutDefinition, LayoutContextData, LayoutEvent } from './layout.types';
import { Observable } from 'rxjs';

// ─── Core Engine Token ────────────────────────────────────────────────────────

export const LAYOUT_ENGINE = new InjectionToken<LayoutEngineInterface>(
  'LAYOUT_ENGINE',
);

export interface LayoutEngineInterface {
  register(def: LayoutDefinition): void;
  has(id: string): boolean;
  resolve(id: string, context: LayoutContextData): import('./layout.types').ResolvedLayout | null;
}

// ─── Context Token (per-component injection) ─────────────────────────────────

export const LAYOUT_CONTEXT = new InjectionToken<LayoutContextData>(
  'LAYOUT_CONTEXT',
);

// ─── Event Bus Token ──────────────────────────────────────────────────────────

export const LAYOUT_EVENTS = new InjectionToken<Observable<LayoutEvent>>(
  'LAYOUT_EVENTS',
);

// ─── Definition Providers ─────────────────────────────────────────────────────

export const LAYOUT_DEFINITION = new InjectionToken<LayoutDefinition>(
  'LAYOUT_DEFINITION',
);

export const LAYOUT_DEFINITIONS = new InjectionToken<ReadonlyArray<LayoutDefinition>>(
  'LAYOUT_DEFINITIONS',
);

// ─── Direction Token ──────────────────────────────────────────────────────────

export const LAYOUT_DIRECTION = new InjectionToken<'ltr' | 'rtl'>(
  'LAYOUT_DIRECTION',
  { factory: () => 'ltr' },
);

// ─── Diagnostics Enabled Token ────────────────────────────────────────────────

export const LAYOUT_DIAGNOSTICS_ENABLED = new InjectionToken<boolean>(
  'LAYOUT_DIAGNOSTICS_ENABLED',
  { factory: () => false },
);

// ─── Container Query Support Token ────────────────────────────────────────────

export const LAYOUT_CONTAINER_QUERIES_SUPPORTED = new InjectionToken<boolean>(
  'LAYOUT_CONTAINER_QUERIES_SUPPORTED',
  { factory: () => typeof CSS !== 'undefined' && CSS.supports('container-type', 'inline-size') },
);
