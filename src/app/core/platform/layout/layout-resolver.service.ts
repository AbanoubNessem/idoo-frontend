import { Injectable, inject } from '@angular/core';
import {
  LayoutDefinition, LayoutContextData, ResolvedLayout, ResolvedSlot,
  Breakpoint,
} from './layout.types';
import { LayoutRendererService } from './layout-renderer.service';
import { BREAKPOINT_ORDER } from './layout.constants';

@Injectable({ providedIn: 'root' })
export class LayoutResolverService {
  private readonly _renderer = inject(LayoutRendererService);

  resolve(definition: LayoutDefinition, context: LayoutContextData): ResolvedLayout {
    const resolved = this._applyResponsive(definition, context.breakpoint);
    const output   = this._renderer.render(resolved, context);
    const slots    = this._resolveSlots(resolved, context);
    const children = (resolved.children ?? []).map(c => this.resolve(c, context));

    return {
      definition: resolved,
      css:        output.hostCss,
      slots,
      children,
      direction:  resolved.direction ?? context.direction,
      breakpoint: context.breakpoint,
      resolvedAt: new Date().toISOString(),
    };
  }

  private _applyResponsive(def: LayoutDefinition, bp: Breakpoint): LayoutDefinition {
    const responsive = def.responsive;
    if (!responsive) return def;

    // Collect overrides from xs up to current breakpoint (mobile-first cascade)
    const bpIndex = BREAKPOINT_ORDER.indexOf(bp);
    let merged: LayoutDefinition = def;

    for (let i = 0; i <= bpIndex; i++) {
      const bpKey = BREAKPOINT_ORDER[i];
      const override = responsive[bpKey];
      if (override) {
        merged = this._mergeDefinition(merged, override);
      }
    }

    return merged;
  }

  private _mergeDefinition(
    base: LayoutDefinition,
    override: Partial<LayoutDefinition>,
  ): LayoutDefinition {
    return {
      ...base,
      ...override,
      config: override.config
        ? { ...base.config, ...override.config }
        : base.config,
      slots: override.slots ?? base.slots,
    };
  }

  private _resolveSlots(def: LayoutDefinition, context: LayoutContextData): ResolvedSlot[] {
    return (def.slots ?? [])
      .map((slot, i): ResolvedSlot => {
        const hidden = slot.hidden ?? this._evalCondition(slot.hiddenCondition, context);
        return {
          id:     slot.id,
          order:  slot.order ?? i,
          hidden,
          css:    hidden ? { display: 'none' } : {},
        };
      })
      .sort((a, b) => a.order - b.order);
  }

  private _evalCondition(expr: string | undefined, _context: LayoutContextData): boolean {
    // Expression evaluation is intentionally simple; extend via LayoutEngine if needed
    if (!expr) return false;
    return false;
  }
}
