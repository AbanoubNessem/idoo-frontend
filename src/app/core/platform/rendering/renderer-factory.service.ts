import { Injectable, inject } from '@angular/core';
import { FieldRenderer } from './contracts/field-renderer';
import { LayoutRenderer } from './contracts/layout-renderer';
import { ActionRenderer } from './contracts/action-renderer';
import { CellRenderer } from './contracts/cell-renderer';
import { WidgetRenderer } from './contracts/widget-renderer';
import { RendererRegistryService } from './renderer-registry.service';
import { RenderError, FieldType } from './rendering.types';

export interface FactoryResult<T> {
  renderer: T | null;
  error: RenderError | null;
}

@Injectable({ providedIn: 'root' })
export class RendererFactoryService {
  private readonly registry = inject(RendererRegistryService);

  createFieldRenderer(fieldType: FieldType | string): FactoryResult<FieldRenderer> {
    const renderer = this.registry.resolveField(fieldType);
    if (!renderer) {
      return {
        renderer: null,
        error: {
          code: 'FIELD_RENDERER_NOT_FOUND',
          message: `No field renderer registered for type: "${fieldType}"`,
          field: fieldType,
        },
      };
    }
    return { renderer, error: null };
  }

  createLayoutRenderer(layoutType: string): FactoryResult<LayoutRenderer> {
    const renderer = this.registry.resolveLayout(layoutType);
    if (!renderer) {
      return {
        renderer: null,
        error: {
          code: 'LAYOUT_RENDERER_NOT_FOUND',
          message: `No layout renderer registered for type: "${layoutType}"`,
        },
      };
    }
    return { renderer, error: null };
  }

  createActionRenderer(actionType: string): FactoryResult<ActionRenderer> {
    const renderer = this.registry.resolveAction(actionType);
    if (!renderer) {
      return {
        renderer: null,
        error: {
          code: 'ACTION_RENDERER_NOT_FOUND',
          message: `No action renderer registered for type: "${actionType}"`,
        },
      };
    }
    return { renderer, error: null };
  }

  createCellRenderer(fieldType: FieldType | string): FactoryResult<CellRenderer> {
    const renderer = this.registry.resolveCell(fieldType);
    if (!renderer) {
      // Fall back to field renderer for cell display
      const fieldRenderer = this.registry.resolveField(fieldType);
      if (fieldRenderer) {
        return { renderer: null, error: null };
      }
      return {
        renderer: null,
        error: {
          code: 'CELL_RENDERER_NOT_FOUND',
          message: `No cell or field renderer for type: "${fieldType}"`,
        },
      };
    }
    return { renderer, error: null };
  }

  createWidgetRenderer(widgetType: string): FactoryResult<WidgetRenderer> {
    const renderer = this.registry.resolveWidget(widgetType);
    if (!renderer) {
      return {
        renderer: null,
        error: {
          code: 'WIDGET_RENDERER_NOT_FOUND',
          message: `No widget renderer registered for type: "${widgetType}"`,
        },
      };
    }
    return { renderer, error: null };
  }

  canRenderField(fieldType: string): boolean {
    return this.registry.hasField(fieldType);
  }

  canRenderLayout(layoutType: string): boolean {
    return this.registry.hasLayout(layoutType);
  }

  canRenderAction(actionType: string): boolean {
    return this.registry.hasAction(actionType);
  }
}
