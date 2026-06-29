import { Type } from '@angular/core';
import { AdapterConfig, AdapterType, FieldType } from '../rendering.types';
import { UIAdapter } from './adapter.interface';

/**
 * Bootstrap adapter stub.
 * Full implementation deferred to future sprint when Bootstrap integration is required.
 */
export class BootstrapAdapter implements UIAdapter {
  readonly type: AdapterType = 'bootstrap';
  readonly version = '0.0.0';
  readonly isAvailable = false;

  private _config: AdapterConfig = { type: 'bootstrap', version: '0.0.0' };

  getFieldComponent(_fieldType: FieldType | string): Type<unknown> | null { return null; }
  getCellComponent(_fieldType: FieldType | string): Type<unknown> | null { return null; }
  getLayoutComponent(_layoutType: string): Type<unknown> | null { return null; }
  getActionComponent(_actionType: string): Type<unknown> | null { return null; }
  getWidgetComponent(_widgetType: string): Type<unknown> | null { return null; }
  configure(config: AdapterConfig): void { this._config = { ...this._config, ...config }; }
  getConfig(): AdapterConfig { return this._config; }
}
