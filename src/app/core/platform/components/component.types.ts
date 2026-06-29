import { Type } from '@angular/core';

// ─── Field Types ────────────────────────────────────────────────────────────

export type ComponentFieldType =
  | 'text' | 'number' | 'currency' | 'date' | 'time' | 'checkbox' | 'switch'
  | 'textarea' | 'select' | 'lookup' | 'autocomplete' | 'file' | 'image'
  | 'avatar' | 'chip' | 'badge' | 'color' | 'json' | 'markdown';

export type ComponentCategory = 'field' | 'layout' | 'widget' | 'display';

export type ComponentState = 'default' | 'loading' | 'skeleton' | 'error' | 'disabled' | 'readonly';

export type ComponentDensity = 'spacious' | 'comfortable' | 'compact';

export type ValidationTrigger = 'blur' | 'change' | 'submit';

export type PlaygroundScenario =
  | 'default' | 'readonly' | 'disabled' | 'required' | 'error'
  | 'loading' | 'skeleton' | 'rtl' | 'dark' | 'mobile' | 'desktop';

// ─── Component Definition ────────────────────────────────────────────────────

export interface ComponentDefinition {
  readonly key: string;
  readonly version: string;
  readonly category: ComponentCategory;
  readonly fieldType?: ComponentFieldType;
  readonly component: Type<unknown>;
  readonly factory?: () => Promise<Type<unknown>>;
  readonly tags: string[];
  readonly description: string;
  readonly registeredAt: string;
}

export interface ComponentEntry extends ComponentDefinition {
  readonly resolved: boolean;
}

// ─── Field Value Types ───────────────────────────────────────────────────────

export interface SelectOption {
  readonly label: string;
  readonly value: unknown;
  readonly disabled?: boolean;
  readonly icon?: string;
  readonly group?: string;
}

export interface LookupResult {
  readonly id: unknown;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
  readonly meta?: Record<string, unknown>;
}

export interface FileValue {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly url?: string;
  readonly file?: File;
}

export interface ChipValue {
  readonly value: string;
  readonly label?: string;
  readonly removable?: boolean;
}

// ─── Field Configuration ─────────────────────────────────────────────────────

export interface BaseFieldConfig {
  readonly maxLength?: number;
  readonly minLength?: number;
  readonly pattern?: string;
  readonly placeholder?: string;
  readonly autocomplete?: string;
}

export interface NumberFieldConfig extends BaseFieldConfig {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly decimals?: number;
}

export interface CurrencyFieldConfig extends NumberFieldConfig {
  readonly currency?: string;
  readonly locale?: string;
  readonly showSymbol?: boolean;
}

export interface DateFieldConfig extends BaseFieldConfig {
  readonly minDate?: string;
  readonly maxDate?: string;
  readonly dateFormat?: string;
}

export interface TimeFieldConfig extends BaseFieldConfig {
  readonly format?: '12h' | '24h';
}

export interface TextareaFieldConfig extends BaseFieldConfig {
  readonly rows?: number;
  readonly autoResize?: boolean;
  readonly maxRows?: number;
}

export interface SelectFieldConfig extends BaseFieldConfig {
  readonly options: SelectOption[];
  readonly multiple?: boolean;
  readonly searchable?: boolean;
}

export interface LookupFieldConfig extends BaseFieldConfig {
  readonly entityType: string;
  readonly displayField?: string;
  readonly searchDebounce?: number;
  readonly minSearchLength?: number;
}

export interface AutocompleteFieldConfig extends BaseFieldConfig {
  readonly options: SelectOption[];
  readonly freeText?: boolean;
  readonly minSearchLength?: number;
}

export interface FileFieldConfig extends BaseFieldConfig {
  readonly accept?: string;
  readonly maxSizeBytes?: number;
  readonly multiple?: boolean;
}

export interface ImageFieldConfig extends FileFieldConfig {
  readonly previewWidth?: number;
  readonly previewHeight?: number;
  readonly cropEnabled?: boolean;
}

export interface AvatarFieldConfig extends ImageFieldConfig {
  readonly shape?: 'circle' | 'square';
  readonly size?: number;
}

export interface ChipFieldConfig extends BaseFieldConfig {
  readonly suggestions?: string[];
  readonly separator?: string;
  readonly maxChips?: number;
}

export interface ColorFieldConfig extends BaseFieldConfig {
  readonly format?: 'hex' | 'rgb' | 'hsl';
  readonly showInput?: boolean;
  readonly presets?: string[];
}

export interface JsonFieldConfig extends BaseFieldConfig {
  readonly expandLevel?: number;
  readonly readonlyEditor?: boolean;
  readonly height?: string;
}

export interface MarkdownFieldConfig extends BaseFieldConfig {
  readonly toolbar?: string[];
  readonly preview?: boolean;
  readonly height?: string;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

export interface ValidatorSpec {
  readonly type: string;
  readonly params?: Record<string, unknown>;
  readonly message?: string;
}

// ─── Component Context ───────────────────────────────────────────────────────

export interface FieldContext {
  readonly formKey: string;
  readonly entityType?: string;
  readonly entityId?: unknown;
  readonly locale: string;
  readonly density: ComponentDensity;
  readonly permissions: string[];
  readonly model: Record<string, unknown>;
  readonly metadata?: unknown;
}

// ─── Component Metrics ───────────────────────────────────────────────────────

export interface ComponentRenderMetrics {
  readonly componentKey: string;
  readonly renderCount: number;
  readonly lastRenderMs: number;
  readonly avgRenderMs: number;
  readonly errorCount: number;
  readonly firstRenderAt: string;
  readonly lastRenderAt: string;
}

// ─── Component Diagnostics ───────────────────────────────────────────────────

export interface ComponentDiagnosticEvent {
  readonly type: 'render' | 'error' | 'lifecycle' | 'validation' | 'interaction';
  readonly componentKey: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
  readonly timestamp: string;
  readonly durationMs?: number;
}

export interface ComponentDiagnosticsReport {
  readonly events: ComponentDiagnosticEvent[];
  readonly metricsSnapshot: Record<string, ComponentRenderMetrics>;
  readonly registeredCount: number;
  readonly resolvedCount: number;
  readonly generatedAt: string;
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export type ComponentLifecyclePhase =
  | 'created' | 'initialized' | 'rendered' | 'updated' | 'destroyed';

export interface ComponentLifecycleEvent {
  readonly phase: ComponentLifecyclePhase;
  readonly componentKey: string;
  readonly instanceId: string;
  readonly timestamp: string;
  readonly data?: Record<string, unknown>;
}

// ─── Registry Query ──────────────────────────────────────────────────────────

export interface ComponentQuery {
  readonly category?: ComponentCategory;
  readonly fieldType?: ComponentFieldType;
  readonly tags?: string[];
  readonly version?: string;
}

export interface ComponentRegistrationOptions {
  readonly override?: boolean;
  readonly lazy?: boolean;
}

// ─── Tokens ──────────────────────────────────────────────────────────────────

export interface ComponentTokenMap {
  readonly [key: string]: string;
}

export interface ComponentTokenSet {
  readonly componentKey: string;
  readonly tokens: ComponentTokenMap;
  readonly densityOverrides?: Partial<Record<ComponentDensity, ComponentTokenMap>>;
}

// ─── Playground ──────────────────────────────────────────────────────────────

export interface PlaygroundScenarioConfig {
  readonly scenario: PlaygroundScenario;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
}

export interface PlaygroundFieldEntry {
  readonly fieldType: ComponentFieldType;
  readonly label: string;
  readonly defaultValue?: unknown;
  readonly config?: Record<string, unknown>;
}

// ─── Component Contract Base ──────────────────────────────────────────────────

export interface PlatformComponentMeta {
  readonly componentKey: string;
  readonly version: string;
  readonly category: ComponentCategory;
}
