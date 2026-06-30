import { Injectable } from '@angular/core';
import { TableLoadingConfig, TableLoadingNode } from '../rendering.types';

const DEFAULT_SKELETON_ROWS = 5;

@Injectable({ providedIn: 'root' })
export class TableLoadingRendererService {
  private _config: TableLoadingConfig = { skeletonRows: DEFAULT_SKELETON_ROWS };

  configure(config: Partial<TableLoadingConfig>): void {
    this._config = { ...this._config, ...config };
  }

  buildLoadingNode(columnCount: number, config?: Partial<TableLoadingConfig>): TableLoadingNode {
    const rows = config?.skeletonRows ?? this._config.skeletonRows;
    return {
      type:         'loading',
      id:           'loading-state',
      visible:      true,
      skeletonRows: rows,
      columnCount,
    };
  }

  reset(): void {
    this._config = { skeletonRows: DEFAULT_SKELETON_ROWS };
  }
}
