# Sprint 3 — Public API Reference

**Module:** `src/app/core/platform/rendering/`  
**Barrel:** `index.ts`

---

## RenderingEngineService

The primary entry point for all rendering operations.

```typescript
class RenderingEngineService {
  readonly state: Signal<RenderEngineState>;
  readonly isReady: Signal<boolean>;

  initialize(options?: RenderEngineOptions): void;
  renderField(request: FieldRenderRequest, contextOverrides?: Partial<RenderContextData>): Promise<RenderResult>;
  setAdapter(type: AdapterType): void;
  invalidateCache(fieldType?: string): void;
  getMetrics(): RenderMetricsSnapshot;
  getDiagnostics(): RenderDiagnosticsReport;
  reset(): void;
}

interface RenderEngineOptions {
  defaultAdapter?: AdapterType;
  useCache?: boolean;
  defaultContextData?: Partial<RenderContextData>;
}
```

### Usage

```typescript
const engine = inject(RenderingEngineService);
engine.initialize();

const result = await engine.renderField({
  fieldType: 'text',
  fieldKey: 'firstName',
  label: 'First Name',
  value: record.firstName,
  model: record,
  mode: 'display',
});

if (result.success) {
  // result.component, result.inputs ready to pass to ComponentHostComponent
}
```

---

## RendererRegistryService

Manages all registered renderers. Extensible via InjectionTokens.

```typescript
class RendererRegistryService {
  initializeFromInjected(): void;
  registerField(renderer: FieldRenderer): void;
  resolveField(fieldType: string): FieldRenderer | null;
  unregisterField(fieldType: string): boolean;
  hasField(fieldType: string): boolean;
  getAllFieldRenderers(): ReadonlyArray<FieldRenderer>;
  registerLayout(renderer: LayoutRenderer): void;
  resolveLayout(layoutType: string): LayoutRenderer | null;
  registerAction(renderer: ActionRenderer): void;
  resolveAction(actionType: string): ActionRenderer | null;
  registerCell(renderer: CellRenderer): void;
  resolveCell(fieldType: string): CellRenderer | null;
  registerWidget(renderer: WidgetRenderer): void;
  resolveWidget(widgetType: string): WidgetRenderer | null;
  getCounts(): { field, layout, action, cell, widget };
  clear(): void;
}

// InjectionTokens for multi-provider registration
const FIELD_RENDERER: InjectionToken<FieldRenderer>;
const LAYOUT_RENDERER: InjectionToken<LayoutRenderer>;
const ACTION_RENDERER: InjectionToken<ActionRenderer>;
const CELL_RENDERER: InjectionToken<CellRenderer>;
const WIDGET_RENDERER: InjectionToken<WidgetRenderer>;
```

### Plugin Registration Example

```typescript
providers: [
  { provide: FIELD_RENDERER, useClass: MyCustomRenderer, multi: true }
]
```

---

## AdapterManagerService

```typescript
class AdapterManagerService {
  readonly activeAdapterType: Signal<AdapterType>;
  readonly activeAdapter: Signal<UIAdapter>;

  registerAdapter(adapter: UIAdapter): void;
  setActiveAdapter(type: AdapterType): void;
  getAdapter(type?: AdapterType): UIAdapter;
  isAdapterAvailable(type: AdapterType): boolean;
  configure(config: AdapterConfig): void;
  getRegisteredTypes(): AdapterType[];
}
```

---

## ComponentHostComponent

Hosts a dynamically resolved component.

```html
<platform-component-host
  [component]="result.component"
  [inputs]="result.inputs">
</platform-component-host>
```

---

## Key Types

```typescript
type FieldType = 'text' | 'number' | 'currency' | 'date' | 'time' | 'datetime'
  | 'boolean' | 'email' | 'phone' | 'textarea' | 'select' | 'lookup'
  | 'autocomplete' | 'file' | 'image' | 'avatar' | 'chip' | 'badge'
  | 'color' | 'json' | 'markdown';

type RenderMode = 'display' | 'edit' | 'filter';
type AdapterType = 'material' | 'primeng' | 'bootstrap' | 'tailwind';
type RenderEngineState = 'uninitialized' | 'initializing' | 'ready' | 'error';

interface FieldRenderRequest {
  fieldType: FieldType | string;
  fieldKey: string;
  label: string;
  value: unknown;
  model: Record<string, unknown>;
  mode: RenderMode;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  hiddenExpression?: string;
  disabledExpression?: string;
  options?: Array<{ value: unknown; label: string }>;
  validators?: string[];
  permissions?: string[];
  config?: Record<string, unknown>;
}

interface RenderResult {
  requestId: string;
  success: boolean;
  component: Type<unknown> | null;
  inputs: Record<string, unknown>;
  errors: RenderError[];
  durationMs: number;
  fromCache: boolean;
  adapter: AdapterType;
}
```
