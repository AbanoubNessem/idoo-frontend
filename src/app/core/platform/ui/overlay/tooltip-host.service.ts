import { Injectable, inject, signal, PLATFORM_ID, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Overlay, OverlayConfig as CdkOverlayConfig,
  OverlayRef as CdkOverlayRef,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipConfig } from '../ui.types';

const POSITIONS: Record<string, ConnectedPosition[]> = {
  above:  [{ originX: 'center', originY: 'top',    overlayX: 'center', overlayY: 'bottom', offsetY: -6 }],
  below:  [{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top',    offsetY:  6 }],
  before: [{ originX: 'start',  originY: 'center', overlayX: 'end',    overlayY: 'center', offsetX: -6 }],
  after:  [{ originX: 'end',    originY: 'center', overlayX: 'start',  overlayY: 'center', offsetX:  6 }],
};

interface ActiveTooltip {
  cdkRef: CdkOverlayRef;
  showTimer: ReturnType<typeof setTimeout> | null;
  hideTimer: ReturnType<typeof setTimeout> | null;
}

@Injectable({ providedIn: 'root' })
export class TooltipHostService {
  private readonly cdkOverlay = inject(Overlay);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _tooltips  = new Map<string, ActiveTooltip>();
  private readonly _activeId  = signal<string | null>(null);

  readonly activeTooltipId = this._activeId.asReadonly();

  show<T>(
    component: { new(...args: unknown[]): T },
    anchor: ElementRef | HTMLElement,
    config: TooltipConfig,
  ): string {
    if (!isPlatformBrowser(this.platformId)) return '';

    const id       = 'tooltip-' + Math.random().toString(36).slice(2, 8);
    const position = config.position ?? 'above';
    const positions = POSITIONS[position] ?? POSITIONS['above'];

    const el = anchor instanceof ElementRef ? anchor.nativeElement : anchor;
    const positionStrategy = this.cdkOverlay.position()
      .flexibleConnectedTo(el)
      .withPositions(positions);

    const cdkConfig = new CdkOverlayConfig({
      panelClass:      ['platform-tooltip'],
      positionStrategy,
      scrollStrategy:  this.cdkOverlay.scrollStrategies.reposition(),
    });

    const showDelay = config.showDelay ?? 200;
    const showTimer = setTimeout(() => {
      const cdkRef = this.cdkOverlay.create(cdkConfig);
      const portal = new ComponentPortal(component as never);
      cdkRef.attach(portal);

      const existing = this._tooltips.get(id);
      if (existing) {
        this._tooltips.set(id, { ...existing, cdkRef });
      }
      this._activeId.set(id);
    }, showDelay);

    this._tooltips.set(id, { cdkRef: null as never, showTimer, hideTimer: null });
    return id;
  }

  hide(id: string, delay?: number): void {
    const tooltip = this._tooltips.get(id);
    if (!tooltip) return;

    if (tooltip.showTimer) clearTimeout(tooltip.showTimer);

    const hideDelay = delay ?? 0;
    const hideTimer = setTimeout(() => {
      tooltip.cdkRef?.dispose();
      this._tooltips.delete(id);
      if (this._activeId() === id) this._activeId.set(null);
    }, hideDelay);

    this._tooltips.set(id, { ...tooltip, hideTimer });
  }

  hideAll(): void {
    for (const [id] of this._tooltips) this.hide(id);
  }

  isVisible(id: string): boolean {
    return this._tooltips.has(id);
  }
}
