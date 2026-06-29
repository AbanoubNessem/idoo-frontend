import { EventEmitter, Signal } from '@angular/core';
import { PlatformComponent } from './platform-component';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type WidgetVariant = 'filled' | 'outlined' | 'ghost';

/**
 * Contract for platform widget components (charts, KPI cards, summary tiles).
 * Widgets are self-contained display units that may fetch or receive data.
 */
export interface PlatformWidgetComponent extends PlatformComponent {
  readonly componentCategory: 'widget';

  /** Data supplied to the widget from the parent context. */
  readonly data: Signal<unknown>;

  /** Display title for the widget. */
  readonly title: Signal<string>;

  /** Subtitle or description for the widget. */
  readonly subtitle: Signal<string>;

  /** Visual size category. */
  readonly size: Signal<WidgetSize>;

  /** Visual variant. */
  readonly variant: Signal<WidgetVariant>;

  /** Whether the widget data has been loaded. */
  readonly dataLoaded: Signal<boolean>;

  /** Error message if widget data could not be loaded. */
  readonly dataError: Signal<string | null>;

  /** Emitted when the user performs the primary action on the widget. */
  readonly action: EventEmitter<unknown>;

  /** Refreshes widget data from its source. */
  refresh(): void;
}
