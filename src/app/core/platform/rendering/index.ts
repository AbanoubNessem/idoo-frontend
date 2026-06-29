// ─── Types ────────────────────────────────────────────────────────────────────
export * from './rendering.types';

// ─── Context ──────────────────────────────────────────────────────────────────
export { RenderContext } from './renderer-context';

// ─── Contracts ────────────────────────────────────────────────────────────────
export type { FieldRenderer } from './contracts/field-renderer';
export type { LayoutRenderer } from './contracts/layout-renderer';
export type { ActionRenderer } from './contracts/action-renderer';
export type { CellRenderer } from './contracts/cell-renderer';
export type { HeaderRenderer } from './contracts/header-renderer';
export type { FooterRenderer } from './contracts/footer-renderer';
export type { WidgetRenderer } from './contracts/widget-renderer';

// ─── Adapter Interface ────────────────────────────────────────────────────────
export type { UIAdapter } from './adapters/adapter.interface';

// ─── Adapters ─────────────────────────────────────────────────────────────────
export { MaterialAdapter } from './adapters/material.adapter';
export { PrimeNGAdapter } from './adapters/primeng.adapter.stub';
export { BootstrapAdapter } from './adapters/bootstrap.adapter.stub';
export { TailwindAdapter } from './adapters/tailwind.adapter.stub';

// ─── Components ───────────────────────────────────────────────────────────────
export { FieldDisplayComponent } from './components/field-display.component';
export { ComponentHostComponent } from './component-host.component';

// ─── Built-in Renderers ───────────────────────────────────────────────────────
export { AbstractFieldRenderer } from './renderers/abstract-field.renderer';
export { TextRenderer } from './renderers/text.renderer';
export { NumberRenderer } from './renderers/number.renderer';
export { CurrencyRenderer } from './renderers/currency.renderer';
export { DateRenderer } from './renderers/date.renderer';
export { TimeRenderer } from './renderers/time.renderer';
export { DateTimeRenderer } from './renderers/datetime.renderer';
export { BooleanRenderer } from './renderers/boolean.renderer';
export { EmailRenderer } from './renderers/email.renderer';
export { PhoneRenderer } from './renderers/phone.renderer';
export { TextareaRenderer } from './renderers/textarea.renderer';
export { SelectRenderer } from './renderers/select.renderer';
export { LookupRenderer } from './renderers/lookup.renderer';
export { AutocompleteRenderer } from './renderers/autocomplete.renderer';
export { FileRenderer } from './renderers/file.renderer';
export { ImageRenderer } from './renderers/image.renderer';
export { AvatarRenderer } from './renderers/avatar.renderer';
export { ChipRenderer } from './renderers/chip.renderer';
export { BadgeRenderer } from './renderers/badge.renderer';
export { ColorRenderer } from './renderers/color.renderer';
export { JsonRenderer } from './renderers/json.renderer';
export { MarkdownRenderer } from './renderers/markdown.renderer';

// ─── Core Services ────────────────────────────────────────────────────────────
export {
  RendererRegistryService,
  FIELD_RENDERER,
  LAYOUT_RENDERER,
  ACTION_RENDERER,
  CELL_RENDERER,
  WIDGET_RENDERER,
} from './renderer-registry.service';
export { RendererFactoryService } from './renderer-factory.service';
export type { FactoryResult } from './renderer-factory.service';
export { RendererResolverService } from './renderer-resolver.service';
export type { ResolutionResult } from './renderer-resolver.service';
export { RenderCacheService } from './render-cache.service';
export { RenderMetricsService } from './render-metrics.service';
export { RenderEventsService } from './render-events.service';
export { AdapterManagerService } from './adapter-manager.service';
export { RenderPipelineService } from './render-pipeline.service';
export type { PipelineRunOptions } from './render-pipeline.service';
export { RenderDiagnosticsService } from './render-diagnostics.service';
export { RenderingEngineService } from './rendering-engine.service';
export type { RenderEngineOptions } from './rendering-engine.service';
