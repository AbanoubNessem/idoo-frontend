import { InjectionToken } from '@angular/core';
import { TableStateHistoryOptions, TableStateInitializer } from './table-state.types';
import { TABLE_STATE_MAX_HISTORY_DEPTH } from './table-state.constants';

export const TABLE_STATE_MAX_HISTORY_TOKEN = new InjectionToken<number>(
  'TABLE_STATE_MAX_HISTORY',
  { providedIn: 'root', factory: () => TABLE_STATE_MAX_HISTORY_DEPTH },
);

export const TABLE_STATE_HISTORY_OPTIONS = new InjectionToken<TableStateHistoryOptions>(
  'TABLE_STATE_HISTORY_OPTIONS',
);

export const TABLE_STATE_INITIAL = new InjectionToken<TableStateInitializer>(
  'TABLE_STATE_INITIAL',
);
