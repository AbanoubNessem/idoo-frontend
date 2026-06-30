import {
  Directive, input, output, effect, inject, ElementRef, OnInit, OnDestroy,
  signal, computed,
} from '@angular/core';
import { Breakpoint } from './layout.types';
import { BREAKPOINT_WIDTHS, BREAKPOINT_ORDER } from './layout.constants';
import { LAYOUT_CONTAINER_QUERIES_SUPPORTED } from './layout.tokens';

@Directive({
  selector: '[platformContainerQuery]',
  standalone: true,
})
export class ContainerQueryDirective implements OnInit, OnDestroy {
  readonly platformContainerQuery = input<boolean>(true);

  readonly breakpointChange = output<Breakpoint>();

  private readonly _supported = inject(LAYOUT_CONTAINER_QUERIES_SUPPORTED);
  private readonly _el        = inject(ElementRef<HTMLElement>);

  private _observer: ResizeObserver | null = null;
  private readonly _width = signal(0);

  readonly currentBreakpoint = computed<Breakpoint>(() => {
    const w = this._width();
    return this._widthToBreakpoint(w);
  });

  ngOnInit(): void {
    if (!this.platformContainerQuery() || typeof ResizeObserver === 'undefined') return;

    this._observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const w = entry.contentRect.width;
        this._width.set(w);
        this.breakpointChange.emit(this.currentBreakpoint());
      }
    });

    this._observer.observe(this._el.nativeElement);
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
    this._observer = null;
  }

  private _widthToBreakpoint(width: number): Breakpoint {
    let result: Breakpoint = 'xs';
    for (const bp of BREAKPOINT_ORDER) {
      if (width >= BREAKPOINT_WIDTHS[bp]) result = bp;
      else break;
    }
    return result;
  }
}
