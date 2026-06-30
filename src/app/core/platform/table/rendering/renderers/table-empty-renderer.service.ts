import { Injectable } from '@angular/core';
import { TableEmptyConfig, TableEmptyNode } from '../rendering.types';

const DEFAULT_EMPTY: TableEmptyConfig = {
  message: 'No records found.',
  icon:    '&#9723;',
};

@Injectable({ providedIn: 'root' })
export class TableEmptyRendererService {
  private _config: TableEmptyConfig = { ...DEFAULT_EMPTY };

  configure(config: Partial<TableEmptyConfig>): void {
    this._config = { ...DEFAULT_EMPTY, ...config };
  }

  buildEmptyNode(config?: Partial<TableEmptyConfig>): TableEmptyNode {
    const merged = config ? { ...this._config, ...config } : this._config;
    return {
      type:    'empty',
      id:      'empty-state',
      visible: true,
      message: merged.message,
      icon:    merged.icon,
    };
  }

  reset(): void {
    this._config = { ...DEFAULT_EMPTY };
  }
}
