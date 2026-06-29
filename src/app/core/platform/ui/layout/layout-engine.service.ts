import { Injectable, inject, signal, computed } from '@angular/core';
import {
  LayoutConfig, LayoutPreset, GridColumns, FlexDirection,
  AlignItems, JustifyContent, GapSize, BreakpointKey,
} from '../ui.types';
import { ResponsiveEngineService } from '../responsive/responsive-engine.service';

const GAP_MAP: Record<GapSize, string> = {
  none: '0',
  xs:   '0.25rem',
  sm:   '0.5rem',
  md:   '1rem',
  lg:   '1.5rem',
  xl:   '2rem',
};

const ALIGN_MAP: Record<AlignItems, string> = {
  start:    'flex-start',
  center:   'center',
  end:      'flex-end',
  stretch:  'stretch',
  baseline: 'baseline',
};

const JUSTIFY_MAP: Record<JustifyContent, string> = {
  start:   'flex-start',
  center:  'center',
  end:     'flex-end',
  between: 'space-between',
  around:  'space-around',
  evenly:  'space-evenly',
};

const PRESETS: Record<LayoutPreset, LayoutConfig> = {
  grid:      { preset: 'grid',      columns: 12, gap: 'md' },
  flex:      { preset: 'flex',      direction: 'row', gap: 'md', align: 'stretch' },
  stack:     { preset: 'stack',     direction: 'column', gap: 'md' },
  section:   { preset: 'section',   padding: 'lg', maxWidth: '1280px' },
  container: { preset: 'container', padding: 'md', maxWidth: '1280px' },
  card:      { preset: 'card',      padding: 'md' },
  panel:     { preset: 'panel',     padding: 'lg' },
  split:     { preset: 'split',     direction: 'row', gap: 'none' },
};

export interface CssLayoutResult {
  readonly display: string;
  readonly gridTemplateColumns?: string;
  readonly flexDirection?: string;
  readonly alignItems?: string;
  readonly justifyContent?: string;
  readonly gap?: string;
  readonly padding?: string;
  readonly maxWidth?: string;
  readonly flexWrap?: string;
}

@Injectable({ providedIn: 'root' })
export class LayoutEngineService {
  private readonly responsive = inject(ResponsiveEngineService);
  private readonly _configs   = new Map<string, LayoutConfig>();

  getPreset(preset: LayoutPreset): LayoutConfig {
    return PRESETS[preset];
  }

  getAllPresets(): ReadonlyArray<LayoutPreset> {
    return Object.keys(PRESETS) as LayoutPreset[];
  }

  toCss(config: LayoutConfig): CssLayoutResult {
    const active = this.resolveResponsive(config);
    const result: Record<string, string> = {};

    switch (active.preset) {
      case 'grid':
        result['display'] = 'grid';
        result['gridTemplateColumns'] = `repeat(${active.columns ?? 12}, 1fr)`;
        break;
      case 'flex':
      case 'stack':
      case 'split':
        result['display'] = 'flex';
        result['flexDirection'] = active.direction ?? 'row';
        if (active.align)   result['alignItems']     = ALIGN_MAP[active.align];
        if (active.justify) result['justifyContent'] = JUSTIFY_MAP[active.justify];
        if (active.wrap !== undefined) result['flexWrap'] = active.wrap ? 'wrap' : 'nowrap';
        break;
      default:
        result['display'] = 'block';
    }

    if (active.gap)      result['gap']      = GAP_MAP[active.gap];
    if (active.padding)  result['padding']  = GAP_MAP[active.padding];
    if (active.maxWidth) result['maxWidth'] = active.maxWidth;

    return result as unknown as CssLayoutResult;
  }

  gapValue(size: GapSize): string {
    return GAP_MAP[size];
  }

  register(id: string, config: LayoutConfig): void {
    this._configs.set(id, config);
  }

  getConfig(id: string): LayoutConfig | null {
    return this._configs.get(id) ?? null;
  }

  private resolveResponsive(config: LayoutConfig): LayoutConfig {
    if (!config.responsive) return config;
    const bp = this.responsive.breakpoint();
    const override = config.responsive[bp];
    return override ? { ...config, ...override } : config;
  }
}
