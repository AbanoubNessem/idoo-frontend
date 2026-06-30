import { Breakpoint, DeviceClass, LayoutConfig, LayoutType } from './layout.types';

// ─── Breakpoint Widths (px) ───────────────────────────────────────────────────

export const BREAKPOINT_WIDTHS: Readonly<Record<Breakpoint, number>> = {
  xs:  0,
  sm:  576,
  md:  768,
  lg:  992,
  xl:  1200,
  xxl: 1400,
};

export const BREAKPOINT_ORDER: ReadonlyArray<Breakpoint> = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

export const DEVICE_BREAKPOINTS: Readonly<Record<DeviceClass, Breakpoint>> = {
  mobile:  'sm',
  tablet:  'md',
  desktop: 'lg',
};

// ─── Default Configs per Layout Type ─────────────────────────────────────────

export const DEFAULT_LAYOUT_CONFIGS: Partial<Record<LayoutType, LayoutConfig>> = {
  grid: {
    grid: { columns: 12, gap: 'var(--platform-spacing-4)', autoFlow: 'row' },
  },
  flex: {
    flex: { direction: 'row', wrap: true, align: 'start', justify: 'start', gap: 'var(--platform-spacing-4)' },
  },
  rows: {
    flex: { direction: 'column', wrap: false, gap: 'var(--platform-spacing-4)' },
  },
  columns: {
    flex: { direction: 'row', wrap: false, gap: 'var(--platform-spacing-4)' },
  },
  stack: {
    flex: { direction: 'column', gap: 'var(--platform-spacing-3)' },
  },
  cards: {
    cards: { minCardWidth: '280px', gap: 'var(--platform-spacing-4)' },
  },
  sections: {
    flex: { direction: 'column', gap: 'var(--platform-spacing-6)' },
  },
  panels: {
    flex: { direction: 'row', wrap: false, gap: 'var(--platform-spacing-4)' },
  },
  tabs: {
    tabs: { variant: 'underline', position: 'top', animated: true },
  },
  accordion: {
    accordion: { multi: false, animated: true },
  },
  splitter: {
    splitter: { orientation: 'horizontal', initialRatio: 0.5, resizable: true },
  },
  sidebar: {
    sidebar: { sideWidth: '280px', position: 'start', collapsible: true },
  },
  header: {
    padding: 'var(--platform-spacing-3) var(--platform-spacing-4)',
    flex: { direction: 'row', align: 'center', justify: 'between' },
  },
  footer: {
    padding: 'var(--platform-spacing-3) var(--platform-spacing-4)',
    flex: { direction: 'row', align: 'center', justify: 'between' },
  },
  'content-area': {
    padding: 'var(--platform-spacing-4)',
    overflow: 'auto',
  },
  'responsive-container': {
    responsive: { useContainerQueries: true, breakpointSource: 'container' },
  },
  overlay: {
    overlay: { backdrop: true, position: 'center', animation: 'fade', zIndex: 1000 },
  },
  nested: {},
};

// ─── CSS Variable Prefixes ─────────────────────────────────────────────────────

export const LAYOUT_CSS_VAR_PREFIX = '--layout';
export const LAYOUT_TOKEN_PREFIX = '--platform';

// ─── Grid Column Span Helpers ─────────────────────────────────────────────────

export const GRID_SPAN_FULL = '1 / -1';

// ─── Elevation CSS Variables ──────────────────────────────────────────────────

export const ELEVATION_MAP: Readonly<Record<0 | 1 | 2 | 3 | 4 | 5, string>> = {
  0: 'none',
  1: 'var(--platform-elevation-1, 0 1px 3px rgba(0,0,0,0.12))',
  2: 'var(--platform-elevation-2, 0 3px 6px rgba(0,0,0,0.16))',
  3: 'var(--platform-elevation-3, 0 6px 12px rgba(0,0,0,0.18))',
  4: 'var(--platform-elevation-4, 0 10px 20px rgba(0,0,0,0.20))',
  5: 'var(--platform-elevation-5, 0 16px 32px rgba(0,0,0,0.24))',
};

// ─── Flex Justify Map ─────────────────────────────────────────────────────────

export const FLEX_JUSTIFY_MAP: Readonly<Record<string, string>> = {
  start:   'flex-start',
  center:  'center',
  end:     'flex-end',
  between: 'space-between',
  around:  'space-around',
  evenly:  'space-evenly',
};

export const FLEX_ALIGN_MAP: Readonly<Record<string, string>> = {
  start:    'flex-start',
  center:   'center',
  end:      'flex-end',
  stretch:  'stretch',
  baseline: 'baseline',
};

// ─── Logical Property Map (RTL support) ───────────────────────────────────────

export const LOGICAL_INLINE_START = 'inline-start';
export const LOGICAL_INLINE_END   = 'inline-end';

// ─── Default slot order sentinel ─────────────────────────────────────────────

export const DEFAULT_SLOT_ORDER = 0;

// ─── Registry ─────────────────────────────────────────────────────────────────

export const LAYOUT_SCHEMA_VERSION = '1.0' as const;
export const MAX_NESTED_DEPTH = 8;
