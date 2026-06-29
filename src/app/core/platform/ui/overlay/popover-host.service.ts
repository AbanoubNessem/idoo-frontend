import { Injectable, inject, Type, ElementRef } from '@angular/core';
import {
  Overlay, OverlayConfig as CdkOverlayConfig,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { PopoverConfig, OverlayRef } from '../ui.types';
import { OverlayManagerService } from './overlay-manager.service';

const POSITION_MAP: Record<string, ConnectedPosition[]> = {
  above:  [{ originX: 'center', originY: 'top',    overlayX: 'center', overlayY: 'bottom', offsetY: -8 }],
  below:  [{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top',    offsetY:  8 }],
  before: [{ originX: 'start',  originY: 'center', overlayX: 'end',    overlayY: 'center', offsetX: -8 }],
  after:  [{ originX: 'end',    originY: 'center', overlayX: 'start',  overlayY: 'center', offsetX:  8 }],
};

@Injectable({ providedIn: 'root' })
export class PopoverHostService {
  private readonly cdkOverlay = inject(Overlay);
  private readonly manager    = inject(OverlayManagerService);

  open<T, R = unknown>(
    component: Type<T>,
    anchor: ElementRef | HTMLElement,
    config: PopoverConfig = {},
  ): OverlayRef<R> {
    const preferred = config.preferredPosition ?? 'below';
    const positions = [
      ...(POSITION_MAP[preferred] ?? POSITION_MAP['below']),
      // Fallback positions
      ...Object.entries(POSITION_MAP)
        .filter(([k]) => k !== preferred)
        .flatMap(([, pos]) => pos),
    ];

    const el = anchor instanceof ElementRef ? anchor.nativeElement : anchor;
    const positionStrategy = this.cdkOverlay.position()
      .flexibleConnectedTo(el)
      .withPositions(positions)
      .withFlexibleDimensions(false)
      .withPush(true);

    const cdkConfig = new CdkOverlayConfig({
      hasBackdrop:     config.hasBackdrop ?? false,
      panelClass:      ['platform-popover'],
      positionStrategy,
      scrollStrategy:  this.cdkOverlay.scrollStrategies.reposition(),
    });

    const cdkRef    = this.cdkOverlay.create(cdkConfig);
    const portal    = new ComponentPortal(component);
    cdkRef.attach(portal);

    let resolvePromise: (v: R | undefined) => void;
    const afterClosedPromise = new Promise<R | undefined>(res => { resolvePromise = res; });

    const id = 'popover-' + Date.now().toString(36);
    const ref: OverlayRef<R> = {
      id,
      type: 'popover',
      close: (result?: R) => {
        cdkRef.dispose();
        resolvePromise(result);
      },
      afterClosed: () => afterClosedPromise,
    };

    return ref;
  }
}
