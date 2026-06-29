import { Injectable, inject } from '@angular/core';
import { MaterialAdapter } from '../../rendering/adapters/material.adapter';
import { ComponentRegistryService } from '../registry/component-registry.service';

// Platform field components
import { PlatformTextFieldComponent }         from '../fields/text-field/platform-text-field.component';
import { PlatformNumberFieldComponent }       from '../fields/number-field/platform-number-field.component';
import { PlatformCurrencyFieldComponent }     from '../fields/currency-field/platform-currency-field.component';
import { PlatformDateFieldComponent }         from '../fields/date-field/platform-date-field.component';
import { PlatformTimeFieldComponent }         from '../fields/time-field/platform-time-field.component';
import { PlatformCheckboxFieldComponent }     from '../fields/checkbox-field/platform-checkbox-field.component';
import { PlatformSwitchFieldComponent }       from '../fields/switch-field/platform-switch-field.component';
import { PlatformTextareaFieldComponent }     from '../fields/textarea-field/platform-textarea-field.component';
import { PlatformSelectFieldComponent }       from '../fields/select-field/platform-select-field.component';
import { PlatformLookupFieldComponent }       from '../fields/lookup-field/platform-lookup-field.component';
import { PlatformAutocompleteFieldComponent } from '../fields/autocomplete-field/platform-autocomplete-field.component';
import { PlatformFileFieldComponent }         from '../fields/file-field/platform-file-field.component';
import { PlatformImageFieldComponent }        from '../fields/image-field/platform-image-field.component';
import { PlatformAvatarFieldComponent }       from '../fields/avatar-field/platform-avatar-field.component';
import { PlatformChipFieldComponent }         from '../fields/chip-field/platform-chip-field.component';
import { PlatformBadgeFieldComponent }        from '../fields/badge-field/platform-badge-field.component';
import { PlatformColorFieldComponent }        from '../fields/color-field/platform-color-field.component';
import { PlatformJsonFieldComponent }         from '../fields/json-field/platform-json-field.component';
import { PlatformMarkdownFieldComponent }     from '../fields/markdown-field/platform-markdown-field.component';

/**
 * Wires the Platform Component Library into the Material Adapter.
 *
 * This service replaces the Sprint 3 placeholder `FieldDisplayComponent`
 * mappings with the real, fully-featured platform field components.
 *
 * Call `connect()` once at application bootstrap (e.g., in APP_INITIALIZER
 * or in the root AppComponent constructor).
 *
 * Platform components are NOT exposed as Angular Material APIs — the Material
 * Adapter's `getFieldComponent()` returns a plain `Type<unknown>`. Consuming
 * code never imports from @angular/material directly.
 */
@Injectable({ providedIn: 'root' })
export class MaterialAdapterConnector {
  private readonly adapter  = inject(MaterialAdapter);
  private readonly registry = inject(ComponentRegistryService);

  private _connected = false;

  get connected(): boolean { return this._connected; }

  /**
   * Registers all 19 platform field components in the MaterialAdapter
   * and the ComponentRegistry. Idempotent — subsequent calls are no-ops.
   */
  connect(): void {
    if (this._connected) return;

    const FIELD_MAP: Array<[string, unknown]> = [
      ['text',         PlatformTextFieldComponent],
      ['number',       PlatformNumberFieldComponent],
      ['currency',     PlatformCurrencyFieldComponent],
      ['date',         PlatformDateFieldComponent],
      ['time',         PlatformTimeFieldComponent],
      ['boolean',      PlatformCheckboxFieldComponent],
      ['checkbox',     PlatformCheckboxFieldComponent],
      ['switch',       PlatformSwitchFieldComponent],
      ['textarea',     PlatformTextareaFieldComponent],
      ['select',       PlatformSelectFieldComponent],
      ['lookup',       PlatformLookupFieldComponent],
      ['autocomplete', PlatformAutocompleteFieldComponent],
      ['file',         PlatformFileFieldComponent],
      ['image',        PlatformImageFieldComponent],
      ['avatar',       PlatformAvatarFieldComponent],
      ['chip',         PlatformChipFieldComponent],
      ['badge',        PlatformBadgeFieldComponent],
      ['color',        PlatformColorFieldComponent],
      ['json',         PlatformJsonFieldComponent],
      ['markdown',     PlatformMarkdownFieldComponent],
      ['email',        PlatformTextFieldComponent],
      ['phone',        PlatformTextFieldComponent],
    ] as const;

    for (const [key, component] of FIELD_MAP) {
      this.adapter.registerFieldComponent(key, component as never);
    }

    this._registerInComponentRegistry();
    this._connected = true;
  }

  private _registerInComponentRegistry(): void {
    const REGISTRY_ENTRIES = [
      { key: 'platform-text-field',         component: PlatformTextFieldComponent,         fieldType: 'text' as const },
      { key: 'platform-number-field',       component: PlatformNumberFieldComponent,       fieldType: 'number' as const },
      { key: 'platform-currency-field',     component: PlatformCurrencyFieldComponent,     fieldType: 'currency' as const },
      { key: 'platform-date-field',         component: PlatformDateFieldComponent,         fieldType: 'date' as const },
      { key: 'platform-time-field',         component: PlatformTimeFieldComponent,         fieldType: 'time' as const },
      { key: 'platform-checkbox-field',     component: PlatformCheckboxFieldComponent,     fieldType: 'checkbox' as const },
      { key: 'platform-switch-field',       component: PlatformSwitchFieldComponent,       fieldType: 'switch' as const },
      { key: 'platform-textarea-field',     component: PlatformTextareaFieldComponent,     fieldType: 'textarea' as const },
      { key: 'platform-select-field',       component: PlatformSelectFieldComponent,       fieldType: 'select' as const },
      { key: 'platform-lookup-field',       component: PlatformLookupFieldComponent,       fieldType: 'lookup' as const },
      { key: 'platform-autocomplete-field', component: PlatformAutocompleteFieldComponent, fieldType: 'autocomplete' as const },
      { key: 'platform-file-field',         component: PlatformFileFieldComponent,         fieldType: 'file' as const },
      { key: 'platform-image-field',        component: PlatformImageFieldComponent,        fieldType: 'image' as const },
      { key: 'platform-avatar-field',       component: PlatformAvatarFieldComponent,       fieldType: 'avatar' as const },
      { key: 'platform-chip-field',         component: PlatformChipFieldComponent,         fieldType: 'chip' as const },
      { key: 'platform-badge-field',        component: PlatformBadgeFieldComponent,        fieldType: 'badge' as const },
      { key: 'platform-color-field',        component: PlatformColorFieldComponent,        fieldType: 'color' as const },
      { key: 'platform-json-field',         component: PlatformJsonFieldComponent,         fieldType: 'json' as const },
      { key: 'platform-markdown-field',     component: PlatformMarkdownFieldComponent,     fieldType: 'markdown' as const },
    ];

    for (const entry of REGISTRY_ENTRIES) {
      if (!this.registry.hasKey(entry.key)) {
        this.registry.register({
          key:          entry.key,
          version:      '5.0',
          category:     'field',
          fieldType:    entry.fieldType,
          component:    entry.component,
          tags:         ['field', entry.fieldType, 'material'],
          description:  `Platform ${entry.fieldType} field component backed by Angular Material`,
          registeredAt: new Date().toISOString(),
        });
      }
    }
  }
}
