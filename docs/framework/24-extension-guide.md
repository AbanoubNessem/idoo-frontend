# iDoo ERP Platform — Extension Guide

---

## 1. Overview

This guide explains how to extend the platform beyond standard entity metadata — adding custom field types, custom validators, custom cell renderers, custom widget types, and cross-plugin integrations. These extension points allow the platform to accommodate any ERP requirement without modifying platform engine code.

---

## 2. Extension Points Summary

| Extension Point | Registration Method | Use Case |
|---|---|---|
| Custom field type | `FieldRegistry.register()` | Domain-specific input (salary grade, color picker) |
| Custom validator | `ValidatorRegistry.register()` | Domain-specific validation (plate number format) |
| Custom async validator | `AsyncValidatorRegistry.register()` | Server-side uniqueness check |
| Custom cell renderer | `CellRendererRegistry.register()` | Complex table cell (progress bar, map link) |
| Custom widget | `WidgetRegistry.register()` | Dashboard widget (headcount chart, expense summary) |
| Custom action handler | `ActionDef.handler` | Any HTTP call or business logic |
| Form lifecycle hook | `FormSchema.hooks` | Pre/post submit transformations |
| Table lifecycle hook | `TableDef.hooks` | Post-load data transformations |
| Event Bus listener | `EventBus.on()` | React to events from other modules |
| Custom escape hatch | `EntityDef.customComponent` | Screens that cannot be expressed as metadata |

---

## 3. Custom Field Type

### 3.1 Define the Component

```typescript
@Component({
  standalone: true,
  selector: 'app-color-picker-field',
  template: `
    <input type="color" [formControl]="control" />
    <span>{{ control.value }}</span>
  `,
})
export class ColorPickerFieldComponent extends FieldComponent {}
```

### 3.2 Register in Plugin Init

```typescript
// In plugin's provider factory or init function:
export function provideFleetPlugin(): Provider[] {
  return [
    ...providePlugin(FleetPluginDef),
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        const fieldRegistry = inject(FieldRegistry);
        fieldRegistry.register('color-picker', {
          component: () => Promise.resolve(ColorPickerFieldComponent),
        });
      },
      multi: true,
    }
  ];
}
```

### 3.3 Use in FormFieldDef

```typescript
{ key: 'brandColor', type: 'color-picker', label: 'Brand Color' }
```

---

## 4. Custom Validator

```typescript
// In plugin init:
const validatorRegistry = inject(ValidatorRegistry);
validatorRegistry.register('egyptianNationalId', (_, message) =>
  (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const valid = /^\d{14}$/.test(control.value);
    return valid ? null : { egyptianNationalId: message ?? 'Must be a valid 14-digit National ID.' };
  }
);
```

Usage in `FormFieldDef`:

```typescript
{
  key: 'nationalId',
  type: 'text',
  label: 'National ID',
  validators: [
    { type: 'required' },
    { type: 'egyptianNationalId' },
  ],
}
```

---

## 5. Custom Cell Renderer

For table columns that need custom rendering beyond built-in `ColumnType` values:

```typescript
@Component({
  standalone: true,
  selector: 'app-vehicle-status-cell',
  template: `
    <div class="vehicle-status" [class]="row()['status']">
      <mat-icon>{{ icon() }}</mat-icon>
      {{ row()['status'] }}
    </div>
  `,
})
export class VehicleStatusCellComponent {
  @Input() row!: Record<string, unknown>;
  @Input() column!: ColumnDef;
  
  readonly icon = computed(() => ({
    AVAILABLE: 'check_circle',
    IN_USE:    'directions_car',
    MAINTENANCE: 'build',
    RETIRED:   'archive',
  }[this.row['status'] as string] ?? 'help'));
}
```

Registration:

```typescript
cellRendererRegistry.register('vehicle-status', {
  component: VehicleStatusCellComponent,
});
```

Column definition:

```typescript
{ id: 'status', header: 'Status', type: 'custom', customRenderer: 'vehicle-status' }
```

---

## 6. Custom Widget

```typescript
@Component({
  standalone: true,
  selector: 'app-fleet-utilization-widget',
  template: `...`,
})
export class FleetUtilizationWidgetComponent extends WidgetComponent {
  private readonly widgetData = inject(WidgetDataService);
  
  readonly data = this.widgetData.query<UtilizationData>('/v1/fleet/utilization', {
    period: (this.config['period'] as string) ?? '30d',
  });
}
```

Registration in plugin:

```typescript
widgetRegistry.register({
  id: 'fleet:widget:utilization',
  name: 'Fleet Utilization',
  icon: 'pie_chart',
  component: () => Promise.resolve(FleetUtilizationWidgetComponent),
  permission: PERMISSIONS.FLEET.VEHICLES.READ,
  minWidth: 3,
  configSchema: {
    sections: [{
      id: 'config',
      fields: [
        { key: 'period', type: 'select', label: 'Period',
          options: [
            { value: '7d',  label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
          ]
        }
      ]
    }]
  }
});
```

---

## 7. Cross-Plugin Integration via Event Bus

Use the Event Bus when one plugin needs to react to events in another plugin without creating a direct import dependency:

```typescript
// Fleet plugin: emit when driver is assigned
eventBus.emit({
  type: 'fleet:vehicle:assigned',
  vehicleId: '...',
  driverId: '...',
  assignedAt: new Date().toISOString(),
});

// HR plugin: react without importing from Fleet
inject(EventBus)
  .on('fleet:vehicle:assigned')
  .pipe(takeUntilDestroyed())
  .subscribe(event => {
    // Show assigned vehicle badge on employee profile
  });
```

---

## 8. Custom Screen (EntityDef Escape Hatch)

For screens that cannot be expressed as metadata:

```typescript
const PayrollRunEntityDef: EntityDef = {
  id: 'hr:payroll-run',
  // ... minimal required fields ...
  customComponent: () =>
    import('../screens/payroll-run-screen.component')
      .then(m => m.PayrollRunScreenComponent),
};
```

The custom component receives:
- `@Input() entityDef: EntityDef`
- Full access to all platform services via `inject()`

It is responsible for its own layout, data fetching, and action handling. It should still use `PageHeaderComponent` and `ActionBarComponent` for visual consistency.

---

## 9. Form Lifecycle Hook Example

Use `FormSchema.hooks` to transform data before submit:

```typescript
export const EmployeeCreateFormSchema: FormSchema = {
  sections: [...],
  hooks: {
    beforeSubmit: (value) => ({
      ...value,
      // Combine firstName + lastName into fullName before sending
      fullName: `${value['firstName']} ${value['lastName']}`,
    }),
    afterSave: (record) => {
      // Refresh the HR headcount widget after employee creation
      inject(EventBus).emit({ type: 'hr:headcount:changed' });
    },
  },
};
```

---

## 10. Platform Extension Rules

1. **Never modify engine source code** to add plugin-specific behaviour — use extension points.
2. **Never import from a sibling plugin** — use Event Bus for cross-plugin communication.
3. **Register extensions in plugin init** — not in `app.config.ts`.
4. **Lazy-load custom components** — use the `() => Promise<Type<...>>` pattern to keep the core bundle small.
5. **Document custom types** — when registering a custom field or validator type, add it to the plugin's `README.md` or types file so other developers can discover it.
