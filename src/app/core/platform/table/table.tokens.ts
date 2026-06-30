import { InjectionToken } from '@angular/core';
import { TableDefinition, TableRegistryLayer } from './table.types';

export const TABLE_DEFAULT_LAYER = new InjectionToken<TableRegistryLayer>(
  'TABLE_DEFAULT_LAYER',
  { factory: () => 'module' },
);

export const TABLE_INITIAL_DEFINITIONS = new InjectionToken<TableDefinition[]>(
  'TABLE_INITIAL_DEFINITIONS',
  { factory: () => [] },
);

export const TABLE_MAX_DIAG_EVENTS_TOKEN = new InjectionToken<number>(
  'TABLE_MAX_DIAG_EVENTS_TOKEN',
  { factory: () => 500 },
);
