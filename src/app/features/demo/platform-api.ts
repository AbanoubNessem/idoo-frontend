/**
 * Platform API — typed factory functions for defining platform entities, forms,
 * lookups, and actions without touching any framework internals.
 *
 * All functions return the same object they receive (identity with TypeScript inference).
 * Their value is IDE autocompletion, type enforcement, and readability.
 */

import { FormDefinition, ValidatorSpec } from '../../core/platform/forms/form.types';

// ─── Entity ──────────────────────────────────────────────────────────────────

export interface EntityFieldConfig {
  readonly key:          string;
  readonly type:         string;
  readonly label:        string;
  readonly required?:    boolean;
  readonly validators?:  ValidatorSpec[];
  readonly metadata?:    Record<string, unknown>;
}

export interface EntityConfig {
  readonly id:           string;
  readonly displayName:  string;
  readonly pluralName?:  string;
  readonly description?: string;
  readonly icon?:        string;
  readonly fields:       EntityFieldConfig[];
  readonly permissions?: string[];
  readonly metadata?:    Record<string, unknown>;
}

export interface EntityDefinition extends EntityConfig {
  readonly __type: 'entity';
}

// ─── Lookup ──────────────────────────────────────────────────────────────────

export interface LookupConfig {
  readonly id:         string;
  readonly label:      string;
  readonly queryType:  string;
  readonly valueKey?:  string;
  readonly labelKey?:  string;
  readonly config?:    Record<string, unknown>;
}

export interface LookupDefinition extends LookupConfig {
  readonly __type: 'lookup';
}

// ─── Action ──────────────────────────────────────────────────────────────────

export type ActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ActionConfig {
  readonly id:                  string;
  readonly label:               string;
  readonly icon?:               string;
  readonly variant?:            ActionVariant;
  readonly permissions?:        string[];
  readonly disabledExpression?: string;
  readonly hiddenExpression?:   string;
  readonly handler?:            string;
}

export interface ActionDefinition extends ActionConfig {
  readonly __type: 'action';
}

// ─── Factory Functions ────────────────────────────────────────────────────────

export function defineEntity(config: EntityConfig): EntityDefinition {
  return { ...config, __type: 'entity' };
}

export function defineForm(config: FormDefinition): FormDefinition {
  return config;
}

export function defineLookup(config: LookupConfig): LookupDefinition {
  return { ...config, __type: 'lookup' };
}

export function defineAction(config: ActionConfig): ActionDefinition {
  return { ...config, __type: 'action' };
}
