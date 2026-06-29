import { Injectable, Type } from '@angular/core';
import { AdapterConfig, AdapterType, FieldType } from '../rendering.types';
import { UIAdapter } from './adapter.interface';
import { FieldDisplayComponent } from '../components/field-display.component';

/**
 * Angular Material 22 adapter.
 *
 * Sprint 3: returns FieldDisplayComponent for all field types (display infrastructure).
 * Sprint 4 (Dynamic Forms): will map each field type to its Material form field component.
 */
@Injectable({ providedIn: 'root' })
export class MaterialAdapter implements UIAdapter {
  readonly type: AdapterType = 'material';
  readonly version = '22.0';
  readonly isAvailable = true;

  private _config: AdapterConfig = {
    type: 'material',
    version: '22.0',
    themeTokens: {
      primary: '#1976d2',
      accent: '#ff4081',
      warn: '#f44336',
    },
  };

  // Field type → component mapping.
  // Sprint 3: all types use FieldDisplayComponent (display-only infrastructure).
  // Sprint 4: replace with full Material form field components.
  private readonly fieldComponentMap = new Map<FieldType | string, Type<unknown>>([
    ['text',         FieldDisplayComponent],
    ['number',       FieldDisplayComponent],
    ['currency',     FieldDisplayComponent],
    ['date',         FieldDisplayComponent],
    ['time',         FieldDisplayComponent],
    ['datetime',     FieldDisplayComponent],
    ['boolean',      FieldDisplayComponent],
    ['email',        FieldDisplayComponent],
    ['phone',        FieldDisplayComponent],
    ['textarea',     FieldDisplayComponent],
    ['select',       FieldDisplayComponent],
    ['lookup',       FieldDisplayComponent],
    ['autocomplete', FieldDisplayComponent],
    ['file',         FieldDisplayComponent],
    ['image',        FieldDisplayComponent],
    ['avatar',       FieldDisplayComponent],
    ['chip',         FieldDisplayComponent],
    ['badge',        FieldDisplayComponent],
    ['color',        FieldDisplayComponent],
    ['json',         FieldDisplayComponent],
    ['markdown',     FieldDisplayComponent],
  ]);

  getFieldComponent(fieldType: FieldType | string): Type<unknown> | null {
    return this.fieldComponentMap.get(fieldType) ?? FieldDisplayComponent;
  }

  getCellComponent(fieldType: FieldType | string): Type<unknown> | null {
    return this.getFieldComponent(fieldType);
  }

  getLayoutComponent(_layoutType: string): Type<unknown> | null {
    return null;
  }

  getActionComponent(_actionType: string): Type<unknown> | null {
    return null;
  }

  getWidgetComponent(_widgetType: string): Type<unknown> | null {
    return null;
  }

  configure(config: AdapterConfig): void {
    this._config = { ...this._config, ...config };
  }

  getConfig(): AdapterConfig {
    return this._config;
  }

  registerFieldComponent(fieldType: FieldType | string, component: Type<unknown>): void {
    this.fieldComponentMap.set(fieldType, component);
  }
}
