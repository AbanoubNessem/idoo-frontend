import { Type } from '@angular/core';
import { AdapterConfig, AdapterType, FieldType } from '../rendering.types';

export interface UIAdapter {
  readonly type: AdapterType;
  readonly version: string;
  readonly isAvailable: boolean;

  getFieldComponent(fieldType: FieldType | string): Type<unknown> | null;
  getCellComponent(fieldType: FieldType | string): Type<unknown> | null;
  getLayoutComponent(layoutType: string): Type<unknown> | null;
  getActionComponent(actionType: string): Type<unknown> | null;
  getWidgetComponent(widgetType: string): Type<unknown> | null;

  configure(config: AdapterConfig): void;
  getConfig(): AdapterConfig;
}
