import { InjectionToken } from '@angular/core';
import { ExperienceProfile, ExperienceStateData } from './experience.types';
import { DEFAULT_EXPERIENCE_STATE } from './experience.constants';

// ─── Diagnostics Toggle ───────────────────────────────────────────────────────

export const EXPERIENCE_DIAGNOSTICS_ENABLED = new InjectionToken<boolean>(
  'EXPERIENCE_DIAGNOSTICS_ENABLED',
  { factory: () => false },
);

// ─── Initial State Override ───────────────────────────────────────────────────

export const EXPERIENCE_INITIAL_STATE = new InjectionToken<Partial<ExperienceStateData>>(
  'EXPERIENCE_INITIAL_STATE',
  { factory: () => ({}) },
);

// ─── Default Profile ──────────────────────────────────────────────────────────

export const EXPERIENCE_DEFAULT_PROFILE = new InjectionToken<ExperienceProfile | null>(
  'EXPERIENCE_DEFAULT_PROFILE',
  { factory: () => null },
);

// ─── Storage Adapter ─────────────────────────────────────────────────────────

export interface ExperienceStorageAdapter {
  save(state: ExperienceStateData): void;
  load(): Partial<ExperienceStateData> | null;
  clear(): void;
}

export const EXPERIENCE_STORAGE = new InjectionToken<ExperienceStorageAdapter>(
  'EXPERIENCE_STORAGE',
);
