import { Injectable } from '@angular/core';
import {
  LayoutDefinition, LayoutConfig, LayoutContextData, CssProperties,
  LayoutRenderOutput, ResolvedSlot, LayoutSlotDefinition,
} from './layout.types';
import {
  ELEVATION_MAP, FLEX_JUSTIFY_MAP, FLEX_ALIGN_MAP, GRID_SPAN_FULL,
  DEFAULT_LAYOUT_CONFIGS,
} from './layout.constants';

@Injectable({ providedIn: 'root' })
export class LayoutRendererService {

  render(definition: LayoutDefinition, context: LayoutContextData): LayoutRenderOutput {
    const merged  = this._mergeConfig(definition);
    const hostCss = this._toHostCss(definition, merged, context);
    const slotCss = this._toSlotCss(definition.slots ?? [], merged);
    const childCss: CssProperties[] = [];
    const cssVars  = this._toCssVars(definition);

    return { hostCss, slotCss, childCss, cssVars };
  }

  toCssString(props: CssProperties): string {
    return Object.entries(props).map(([k, v]) => `${k}: ${v}`).join('; ');
  }

  private _mergeConfig(def: LayoutDefinition): LayoutConfig {
    const defaults = DEFAULT_LAYOUT_CONFIGS[def.type] ?? {};
    return this._deepMergeConfig(defaults, def.config ?? {});
  }

  private _deepMergeConfig(a: LayoutConfig, b: LayoutConfig): LayoutConfig {
    return {
      ...a,
      ...b,
      grid:       { ...a.grid,      ...b.grid },
      flex:       { ...a.flex,      ...b.flex },
      sidebar:    { ...a.sidebar,   ...b.sidebar },
      splitter:   { ...a.splitter,  ...b.splitter },
      tabs:       { ...a.tabs,      ...b.tabs },
      accordion:  { ...a.accordion, ...b.accordion },
      cards:      { ...a.cards,     ...b.cards },
      overlay:    { ...a.overlay,   ...b.overlay },
      responsive: { ...a.responsive,...b.responsive },
    };
  }

  private _toHostCss(
    def: LayoutDefinition,
    cfg: LayoutConfig,
    context: LayoutContextData,
  ): CssProperties {
    const css: Record<string, string> = {};
    const dir = def.direction ?? context.direction;
    const isRtl = dir === 'rtl';

    // Common sizing
    if (cfg.width)     css['width']      = cfg.width;
    if (cfg.height)    css['height']     = cfg.height;
    if (cfg.minWidth)  css['min-width']  = cfg.minWidth;
    if (cfg.maxWidth)  css['max-width']  = cfg.maxWidth;
    if (cfg.minHeight) css['min-height'] = cfg.minHeight;
    if (cfg.maxHeight) css['max-height'] = cfg.maxHeight;
    if (cfg.overflow)  css['overflow']   = cfg.overflow;
    if (cfg.overflowX) css['overflow-x'] = cfg.overflowX;
    if (cfg.overflowY) css['overflow-y'] = cfg.overflowY;

    // Spacing (logical properties for RTL)
    if (cfg.padding) css['padding']  = cfg.padding;
    if (cfg.margin)  css['margin']   = cfg.margin;

    // Elevation
    if (cfg.elevation !== undefined && cfg.elevation in ELEVATION_MAP) {
      const shadow = ELEVATION_MAP[cfg.elevation as keyof typeof ELEVATION_MAP];
      if (shadow !== 'none') css['box-shadow'] = shadow;
    }

    if (cfg.borderRadius) css['border-radius'] = cfg.borderRadius;
    if (cfg.background)   css['background']    = cfg.background;

    // Direction
    css['direction'] = dir;

    // Type-specific layout
    switch (def.type) {
      case 'grid':
        this._applyGrid(css, cfg, isRtl);
        break;
      case 'flex':
      case 'rows':
      case 'columns':
      case 'stack':
      case 'cards':
      case 'sections':
      case 'panels':
      case 'header':
      case 'footer':
        this._applyFlex(css, cfg, def.type, isRtl);
        break;
      case 'sidebar':
        this._applySidebar(css, cfg, isRtl);
        break;
      case 'splitter':
        this._applySplitter(css, cfg);
        break;
      case 'content-area':
        css['display'] = 'block';
        break;
      case 'responsive-container':
        css['container-type'] = 'inline-size';
        break;
      case 'overlay':
        this._applyOverlay(css, cfg);
        break;
      default:
        break;
    }

    return css;
  }

  private _applyGrid(css: Record<string, string>, cfg: LayoutConfig, isRtl: boolean): void {
    const g = cfg.grid ?? {};
    css['display'] = 'grid';

    if (g.columns !== undefined) {
      const cols = typeof g.columns === 'number'
        ? `repeat(${g.columns}, minmax(0, 1fr))`
        : g.columns;
      css['grid-template-columns'] = cols;
    }
    if (g.rows !== undefined) {
      const rows = typeof g.rows === 'number'
        ? `repeat(${g.rows}, minmax(0, 1fr))`
        : g.rows;
      css['grid-template-rows'] = rows;
    }
    if (g.gap)       css['gap']              = g.gap;
    if (g.columnGap) css['column-gap']       = g.columnGap;
    if (g.rowGap)    css['row-gap']          = g.rowGap;
    if (g.autoRows)  css['grid-auto-rows']   = g.autoRows;
    if (g.autoCols)  css['grid-auto-columns']= g.autoCols;
    if (g.autoFlow)  css['grid-auto-flow']   = g.autoFlow;
    if (g.areas?.length) {
      const areas = isRtl ? [...g.areas].reverse() : g.areas;
      css['grid-template-areas'] = areas.map(r => `"${r}"`).join(' ');
    }
  }

  private _applyFlex(
    css: Record<string, string>,
    cfg: LayoutConfig,
    type: string,
    isRtl: boolean,
  ): void {
    const f = cfg.flex ?? {};
    css['display'] = f.inline ? 'inline-flex' : 'flex';

    // Type-driven defaults
    let dir: string = f.direction ?? 'row';
    if (type === 'rows' || type === 'stack' || type === 'sections') dir = 'column';
    if (type === 'columns' || type === 'panels') dir = 'row';

    // RTL: flip row directions
    if (isRtl && dir === 'row')         dir = 'row-reverse';
    else if (isRtl && dir === 'row-reverse') dir = 'row';

    css['flex-direction'] = dir;

    const wrap = f.wrap;
    if (wrap !== undefined) {
      css['flex-wrap'] = wrap === true ? 'wrap' : wrap === false ? 'nowrap' : wrap;
    }

    if (f.align)   css['align-items']     = FLEX_ALIGN_MAP[f.align]   ?? f.align;
    if (f.justify) css['justify-content'] = FLEX_JUSTIFY_MAP[f.justify] ?? f.justify;
    if (f.gap || cfg.gap) css['gap'] = (f.gap ?? cfg.gap)!;

    // Cards: use grid auto-fill instead
    if (type === 'cards') {
      const c = cfg.cards ?? {};
      css['display'] = 'grid';
      css['grid-template-columns'] = `repeat(auto-fill, minmax(${c.minCardWidth ?? '280px'}, 1fr))`;
      if (c.gap) css['gap'] = c.gap;
      delete css['flex-direction'];
      delete css['flex-wrap'];
      delete css['align-items'];
      delete css['justify-content'];
    }
  }

  private _applySidebar(css: Record<string, string>, cfg: LayoutConfig, isRtl: boolean): void {
    const s = cfg.sidebar ?? {};
    css['display'] = 'flex';

    const pos = s.position ?? 'start';
    const isStart = (pos === 'start' && !isRtl) || (pos === 'end' && isRtl);
    css['flex-direction'] = isStart ? 'row' : 'row-reverse';
    css['align-items'] = 'stretch';
  }

  private _applySplitter(css: Record<string, string>, cfg: LayoutConfig): void {
    const s = cfg.splitter ?? {};
    css['display'] = 'flex';
    css['flex-direction'] = s.orientation === 'vertical' ? 'column' : 'row';
    css['overflow'] = 'hidden';
  }

  private _applyOverlay(css: Record<string, string>, cfg: LayoutConfig): void {
    const o = cfg.overlay ?? {};
    css['position'] = 'fixed';
    css['inset'] = '0';
    css['display'] = 'flex';
    css['align-items'] = 'center';
    css['justify-content'] = 'center';
    if (o.zIndex !== undefined) css['z-index'] = String(o.zIndex);
  }

  private _toSlotCss(
    slots: ReadonlyArray<LayoutSlotDefinition>,
    cfg: LayoutConfig,
  ): Readonly<Record<string, CssProperties>> {
    const result: Record<string, CssProperties> = {};
    for (const slot of slots) {
      const slotCss: Record<string, string> = {};
      if (slot.span !== undefined) {
        const spanVal = slot.span === 'full'
          ? GRID_SPAN_FULL
          : typeof slot.span === 'number'
          ? `span ${slot.span}`
          : slot.span;
        slotCss['grid-column'] = spanVal;
      }
      if (slot.minHeight)  slotCss['min-height']  = slot.minHeight;
      if (slot.scrollable) slotCss['overflow-y']  = 'auto';
      if (slot.hidden)     slotCss['display']      = 'none';
      slotCss['order'] = String(slot.order ?? 0);
      result[slot.id] = slotCss;
    }
    return result;
  }

  private _toCssVars(def: LayoutDefinition): CssProperties {
    const vars: Record<string, string> = {};
    const t = def.tokens;
    if (!t) return vars;
    for (const [k, v] of Object.entries(t.spacing ?? {})) {
      if (v !== undefined) vars[`--platform-spacing-${k}`] = v;
    }
    for (const [k, v] of Object.entries(t.elevation ?? {})) {
      if (v !== undefined) vars[`--platform-elevation-${k}`] = v;
    }
    for (const [k, v] of Object.entries(t.borderRadius ?? {})) {
      if (v !== undefined) vars[`--platform-radius-${k}`] = v;
    }
    for (const [k, v] of Object.entries(t.colors ?? {})) {
      if (v !== undefined) vars[`--platform-color-${k}`] = v;
    }
    return vars;
  }
}
