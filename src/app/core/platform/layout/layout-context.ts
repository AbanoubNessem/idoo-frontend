import { signal, computed, Signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  Breakpoint, DeviceClass, LayoutContextData, LayoutDirection, Orientation,
} from './layout.types';
import { BREAKPOINT_WIDTHS, BREAKPOINT_ORDER, DEVICE_BREAKPOINTS } from './layout.constants';
import { LAYOUT_DIRECTION } from './layout.tokens';

export class LayoutContext {
  private readonly _containerWidth  = signal<number | undefined>(undefined);
  private readonly _containerHeight = signal<number | undefined>(undefined);
  private readonly _direction       = signal<LayoutDirection>(this._initialDirection());
  private readonly _permissions     = signal<ReadonlyArray<string>>([]);
  private readonly _model           = signal<Record<string, unknown>>({});

  private _doc: Document | null = null;

  readonly breakpoint: Signal<Breakpoint> = computed(() => {
    const w = this._containerWidth() ?? this._viewportWidth();
    return this._widthToBreakpoint(w);
  });

  readonly device: Signal<DeviceClass> = computed(() => {
    const bp = this.breakpoint();
    const idx = BREAKPOINT_ORDER.indexOf(bp);
    if (idx <= BREAKPOINT_ORDER.indexOf(DEVICE_BREAKPOINTS.mobile))  return 'mobile';
    if (idx <= BREAKPOINT_ORDER.indexOf(DEVICE_BREAKPOINTS.tablet))  return 'tablet';
    return 'desktop';
  });

  readonly orientation: Signal<Orientation> = computed(() => {
    const w = this._containerWidth() ?? this._viewportWidth();
    const h = this._containerHeight() ?? this._viewportHeight();
    return w >= h ? 'landscape' : 'portrait';
  });

  readonly direction: Signal<LayoutDirection> = this._direction.asReadonly();
  readonly permissions: Signal<ReadonlyArray<string>> = this._permissions.asReadonly();
  readonly model: Signal<Record<string, unknown>> = this._model.asReadonly();

  readonly snapshot: Signal<LayoutContextData> = computed(() => ({
    breakpoint:      this.breakpoint(),
    device:          this.device(),
    orientation:     this.orientation(),
    direction:       this.direction(),
    permissions:     this.permissions(),
    model:           this.model(),
    containerWidth:  this._containerWidth(),
    containerHeight: this._containerHeight(),
  }));

  setContainerSize(width: number, height?: number): void {
    this._containerWidth.set(width);
    if (height !== undefined) this._containerHeight.set(height);
  }

  setDirection(dir: LayoutDirection): void {
    this._direction.set(dir);
  }

  setPermissions(perms: ReadonlyArray<string>): void {
    this._permissions.set(perms);
  }

  setModel(model: Record<string, unknown>): void {
    this._model.set(model);
  }

  patchModel(patch: Record<string, unknown>): void {
    this._model.update(m => ({ ...m, ...patch }));
  }

  bindDocument(doc: Document): void {
    this._doc = doc;
  }

  private _initialDirection(): LayoutDirection {
    return 'ltr';
  }

  private _viewportWidth(): number {
    return this._doc?.documentElement.clientWidth ?? 1280;
  }

  private _viewportHeight(): number {
    return this._doc?.documentElement.clientHeight ?? 720;
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
