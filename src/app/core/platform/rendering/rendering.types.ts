import { Type } from '@angular/core';

// ─── Field Types ──────────────────────────────────────────────────────────────

export type FieldType =
  | 'text' | 'number' | 'currency' | 'date' | 'time' | 'datetime'
  | 'boolean' | 'email' | 'phone' | 'textarea' | 'select' | 'lookup'
  | 'autocomplete' | 'file' | 'image' | 'avatar' | 'chip' | 'badge'
  | 'color' | 'json' | 'markdown';

export const ALL_FIELD_TYPES: readonly FieldType[] = [
  'text', 'number', 'currency', 'date', 'time', 'datetime',
  'boolean', 'email', 'phone', 'textarea', 'select', 'lookup',
  'autocomplete', 'file', 'image', 'avatar', 'chip', 'badge',
  'color', 'json', 'markdown',
] as const;

// ─── Renderer Types ───────────────────────────────────────────────────────────

export type RendererType =
  | 'field' | 'layout' | 'action' | 'cell' | 'header' | 'footer' | 'widget';

// ─── Render Modes ─────────────────────────────────────────────────────────────

export type RenderMode = 'display' | 'edit' | 'filter';

// ─── Adapter Types ────────────────────────────────────────────────────────────

export type AdapterType = 'material' | 'primeng' | 'bootstrap' | 'tailwind';

// ─── Engine State ─────────────────────────────────────────────────────────────

export type RenderEngineState = 'uninitialized' | 'initializing' | 'ready' | 'error';

// ─── Pipeline Stages ─────────────────────────────────────────────────────────

export type RenderPipelineStage =
  | 'normalize' | 'resolve' | 'permissions' | 'expressions' | 'validators' | 'context' | 'render';

// ─── Render Requests ──────────────────────────────────────────────────────────

export interface FieldRenderRequest {
  readonly fieldType: FieldType | string;
  readonly fieldKey: string;
  readonly label: string;
  readonly value: unknown;
  readonly model: Record<string, unknown>;
  readonly mode: RenderMode;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly hidden?: boolean;
  readonly hiddenExpression?: string;
  readonly disabledExpression?: string;
  readonly options?: ReadonlyArray<{ value: unknown; label: string }>;
  readonly validators?: ReadonlyArray<string>;
  readonly permissions?: ReadonlyArray<string>;
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface LayoutRenderRequest {
  readonly layoutType: string;
  readonly columns?: 1 | 2 | 3 | 4;
  readonly title?: string;
  readonly children?: ReadonlyArray<unknown>;
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface ActionRenderRequest {
  readonly actionType: 'button' | 'link' | 'icon-button' | 'menu-item';
  readonly label: string;
  readonly icon?: string;
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly disabled?: boolean;
  readonly hidden?: boolean;
  readonly permissions?: ReadonlyArray<string>;
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface CellRenderRequest {
  readonly columnId: string;
  readonly fieldType: FieldType | string;
  readonly value: unknown;
  readonly row: Record<string, unknown>;
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface HeaderRenderRequest {
  readonly label: string;
  readonly sortable?: boolean;
  readonly sorted?: 'asc' | 'desc' | null;
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface FooterRenderRequest {
  readonly label?: string;
  readonly aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  readonly value?: unknown;
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface WidgetRenderRequest {
  readonly widgetType: string;
  readonly title?: string;
  readonly dataSource?: unknown;
  readonly config?: Readonly<Record<string, unknown>>;
}

export type AnyRenderRequest =
  | FieldRenderRequest
  | LayoutRenderRequest
  | ActionRenderRequest
  | CellRenderRequest
  | HeaderRenderRequest
  | FooterRenderRequest
  | WidgetRenderRequest;

export interface RenderRequest {
  readonly requestId: string;
  readonly rendererType: RendererType;
  readonly request: AnyRenderRequest;
  readonly contextOverrides?: Partial<RenderContextData>;
}

// ─── Render Output ────────────────────────────────────────────────────────────

export interface RenderOutput {
  readonly component: Type<unknown> | null;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly template?: string;
}

export interface RenderError {
  readonly code: string;
  readonly message: string;
  readonly stage?: RenderPipelineStage;
  readonly field?: string;
}

export interface RenderResult {
  readonly requestId: string;
  readonly success: boolean;
  readonly component: Type<unknown> | null;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly errors: ReadonlyArray<RenderError>;
  readonly durationMs: number;
  readonly fromCache: boolean;
  readonly adapter: AdapterType;
}

// ─── Render Context ───────────────────────────────────────────────────────────

export interface RenderContextData {
  readonly userId: string;
  readonly tenantId: string;
  readonly permissions: ReadonlySet<string>;
  readonly locale: string;
  readonly adapter: AdapterType;
  readonly mode: RenderMode;
  readonly model: Record<string, unknown>;
}

export interface ResolvedValidator {
  readonly key: string;
  readonly defaultMessage: string;
  readonly config?: Readonly<Record<string, unknown>>;
}

// ─── Renderer Descriptor ─────────────────────────────────────────────────────

export interface RendererDescriptor {
  readonly id: string;
  readonly type: RendererType;
  readonly fieldType?: FieldType | string;
  readonly priority: number;
  readonly sourcePluginId?: string;
}

// ─── Renderer Config ─────────────────────────────────────────────────────────

export interface FieldRendererConfig {
  readonly fieldType: FieldType | string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly classes?: ReadonlyArray<string>;
}

// ─── Adapter Config ───────────────────────────────────────────────────────────

export interface AdapterConfig {
  readonly type: AdapterType;
  readonly version: string;
  readonly themeTokens?: Readonly<Record<string, string>>;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type RenderEventType =
  | 'render:started'
  | 'render:completed'
  | 'render:error'
  | 'render:cache:hit'
  | 'render:cache:miss'
  | 'renderer:registered'
  | 'renderer:unregistered'
  | 'adapter:changed'
  | 'engine:initialized'
  | 'engine:error';

export interface RenderEvent {
  readonly type: RenderEventType;
  readonly timestamp: string;
  readonly payload: unknown;
  readonly correlationId: string;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface RenderMetricsSnapshot {
  readonly totalRenders: number;
  readonly successfulRenders: number;
  readonly failedRenders: number;
  readonly averageDurationMs: number;
  readonly p95DurationMs: number;
  readonly cacheHitRate: number;
  readonly rendererUsage: Readonly<Record<string, number>>;
  readonly generatedAt: string;
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

export interface RenderDiagnosticsReport {
  readonly engineState: RenderEngineState;
  readonly activeAdapter: AdapterType;
  readonly registeredFieldRenderers: number;
  readonly registeredLayoutRenderers: number;
  readonly registeredActionRenderers: number;
  readonly registeredCellRenderers: number;
  readonly registeredWidgetRenderers: number;
  readonly cachedResults: number;
  readonly metrics: RenderMetricsSnapshot | null;
  readonly errors: ReadonlyArray<RenderError>;
  readonly generatedAt: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export interface CachedRenderResult {
  readonly result: RenderResult;
  readonly cachedAt: number;
  readonly hitCount: number;
}
