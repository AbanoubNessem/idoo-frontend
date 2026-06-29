import { Injectable, inject } from '@angular/core';
import { FieldRenderer } from './contracts/field-renderer';
import { CellRenderer } from './contracts/cell-renderer';
import { RendererRegistryService } from './renderer-registry.service';
import { FieldType, RenderMode } from './rendering.types';

export interface ResolutionResult<T> {
  readonly renderer: T | null;
  readonly resolved: boolean;
  readonly fallback: boolean;
}

@Injectable({ providedIn: 'root' })
export class RendererResolverService {
  private readonly registry = inject(RendererRegistryService);

  resolveField(fieldType: FieldType | string, mode?: RenderMode): ResolutionResult<FieldRenderer> {
    const renderer = this.registry.resolveField(fieldType);

    if (renderer) {
      const supportsMode = !mode || renderer.supportedModes.includes(mode);
      return { renderer, resolved: true, fallback: !supportsMode };
    }

    // Fallback: try text renderer for unknown types
    const textFallback = this.registry.resolveField('text');
    if (textFallback) {
      return { renderer: textFallback, resolved: true, fallback: true };
    }

    return { renderer: null, resolved: false, fallback: false };
  }

  resolveCell(fieldType: FieldType | string): ResolutionResult<CellRenderer> {
    const cellRenderer = this.registry.resolveCell(fieldType);
    if (cellRenderer) {
      return { renderer: cellRenderer, resolved: true, fallback: false };
    }

    return { renderer: null, resolved: false, fallback: false };
  }

  supportsField(fieldType: string): boolean {
    return this.registry.hasField(fieldType);
  }

  supportedFieldTypes(): ReadonlyArray<string> {
    return this.registry.getAllFieldRenderers().map(r => r.fieldType);
  }

  getRendererDisplayName(fieldType: string): string {
    const renderer = this.registry.resolveField(fieldType);
    return renderer?.displayName ?? fieldType;
  }
}
