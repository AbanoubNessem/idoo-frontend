import { Injectable, inject, InjectionToken } from '@angular/core';
import { FieldRenderer } from './contracts/field-renderer';
import { LayoutRenderer } from './contracts/layout-renderer';
import { ActionRenderer } from './contracts/action-renderer';
import { CellRenderer } from './contracts/cell-renderer';
import { WidgetRenderer } from './contracts/widget-renderer';
import { RenderEventsService } from './render-events.service';

export const FIELD_RENDERER = new InjectionToken<FieldRenderer>('FIELD_RENDERER');
export const LAYOUT_RENDERER = new InjectionToken<LayoutRenderer>('LAYOUT_RENDERER');
export const ACTION_RENDERER = new InjectionToken<ActionRenderer>('ACTION_RENDERER');
export const CELL_RENDERER = new InjectionToken<CellRenderer>('CELL_RENDERER');
export const WIDGET_RENDERER = new InjectionToken<WidgetRenderer>('WIDGET_RENDERER');

@Injectable({ providedIn: 'root' })
export class RendererRegistryService {
  private readonly events = inject(RenderEventsService);
  private readonly _injectedField = inject(FIELD_RENDERER, { optional: true });

  private readonly fieldRenderers = new Map<string, FieldRenderer>();
  private readonly layoutRenderers = new Map<string, LayoutRenderer>();
  private readonly actionRenderers = new Map<string, ActionRenderer>();
  private readonly cellRenderers = new Map<string, CellRenderer>();
  private readonly widgetRenderers = new Map<string, WidgetRenderer>();

  initializeFromInjected(): void {
    if (this._injectedField) {
      this.registerField(this._injectedField);
    }
  }

  // ─── Field ────────────────────────────────────────────────────────────────

  registerField(renderer: FieldRenderer): void {
    this.fieldRenderers.set(renderer.fieldType, renderer);
    this.events.emit('renderer:registered', { type: 'field', fieldType: renderer.fieldType });
  }

  resolveField(fieldType: string): FieldRenderer | null {
    return this.fieldRenderers.get(fieldType) ?? null;
  }

  unregisterField(fieldType: string): boolean {
    const existed = this.fieldRenderers.delete(fieldType);
    if (existed) this.events.emit('renderer:unregistered', { type: 'field', fieldType });
    return existed;
  }

  hasField(fieldType: string): boolean {
    return this.fieldRenderers.has(fieldType);
  }

  getAllFieldRenderers(): ReadonlyArray<FieldRenderer> {
    return Array.from(this.fieldRenderers.values());
  }

  // ─── Layout ───────────────────────────────────────────────────────────────

  registerLayout(renderer: LayoutRenderer): void {
    this.layoutRenderers.set(renderer.layoutType, renderer);
    this.events.emit('renderer:registered', { type: 'layout', layoutType: renderer.layoutType });
  }

  resolveLayout(layoutType: string): LayoutRenderer | null {
    return this.layoutRenderers.get(layoutType) ?? null;
  }

  hasLayout(layoutType: string): boolean {
    return this.layoutRenderers.has(layoutType);
  }

  getAllLayoutRenderers(): ReadonlyArray<LayoutRenderer> {
    return Array.from(this.layoutRenderers.values());
  }

  // ─── Action ───────────────────────────────────────────────────────────────

  registerAction(renderer: ActionRenderer): void {
    this.actionRenderers.set(renderer.actionType, renderer);
    this.events.emit('renderer:registered', { type: 'action', actionType: renderer.actionType });
  }

  resolveAction(actionType: string): ActionRenderer | null {
    return this.actionRenderers.get(actionType) ?? null;
  }

  hasAction(actionType: string): boolean {
    return this.actionRenderers.has(actionType);
  }

  // ─── Cell ─────────────────────────────────────────────────────────────────

  registerCell(renderer: CellRenderer): void {
    this.cellRenderers.set(renderer.fieldType, renderer);
    this.events.emit('renderer:registered', { type: 'cell', fieldType: renderer.fieldType });
  }

  resolveCell(fieldType: string): CellRenderer | null {
    return this.cellRenderers.get(fieldType) ?? null;
  }

  // ─── Widget ───────────────────────────────────────────────────────────────

  registerWidget(renderer: WidgetRenderer): void {
    this.widgetRenderers.set(renderer.widgetType, renderer);
    this.events.emit('renderer:registered', { type: 'widget', widgetType: renderer.widgetType });
  }

  resolveWidget(widgetType: string): WidgetRenderer | null {
    return this.widgetRenderers.get(widgetType) ?? null;
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  getCounts(): {
    field: number; layout: number; action: number; cell: number; widget: number;
  } {
    return {
      field: this.fieldRenderers.size,
      layout: this.layoutRenderers.size,
      action: this.actionRenderers.size,
      cell: this.cellRenderers.size,
      widget: this.widgetRenderers.size,
    };
  }

  clear(): void {
    this.fieldRenderers.clear();
    this.layoutRenderers.clear();
    this.actionRenderers.clear();
    this.cellRenderers.clear();
    this.widgetRenderers.clear();
  }
}
