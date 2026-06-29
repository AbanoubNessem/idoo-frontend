import { Signal } from '@angular/core';
import { PlatformComponent } from './platform-component';

export type LayoutDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type LayoutAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type LayoutJustify = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
export type LayoutWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

export interface LayoutSlot {
  readonly name: string;
  readonly span?: number;
  readonly order?: number;
}

/**
 * Contract for platform layout components (grids, flex containers, panels).
 * Layout components arrange child components — they have no value or validation.
 */
export interface PlatformLayoutComponent extends PlatformComponent {
  readonly componentCategory: 'layout';

  /** CSS display type for this layout container. */
  readonly display: Signal<'flex' | 'grid' | 'block'>;

  /** Gap between child elements (CSS unit). */
  readonly gap: Signal<string>;

  /** Named layout slots that children can be assigned to. */
  readonly slots: Signal<LayoutSlot[]>;

  /** Number of columns for grid layout. */
  readonly columns: Signal<number | string>;

  /** Flex direction for flex layout. */
  readonly direction: Signal<LayoutDirection>;

  /** Align-items value. */
  readonly align: Signal<LayoutAlign>;

  /** Justify-content value. */
  readonly justify: Signal<LayoutJustify>;

  /** Whether children wrap in flex layout. */
  readonly wrap: Signal<LayoutWrap>;

  /** Padding inside the container (CSS shorthand). */
  readonly padding: Signal<string>;
}
