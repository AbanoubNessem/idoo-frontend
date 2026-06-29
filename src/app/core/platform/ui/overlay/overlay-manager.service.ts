import { Injectable, inject, signal, computed, Type, Injector } from '@angular/core';
import {
  Overlay, OverlayConfig as CdkOverlayConfig,
  OverlayRef as CdkOverlayRef,
  GlobalPositionStrategy, FlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { OverlayConfig, OverlayRef, OverlayType } from '../ui.types';

interface ManagedOverlay {
  readonly cdkRef: CdkOverlayRef;
  readonly ref: OverlayRef;
  resolve: (result: unknown) => void;
}

function genId(): string {
  return 'overlay-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

@Injectable({ providedIn: 'root' })
export class OverlayManagerService {
  private readonly cdkOverlay = inject(Overlay);
  private readonly injector   = inject(Injector);

  private readonly _overlays = new Map<string, ManagedOverlay>();
  private readonly _count    = signal(0);

  readonly openCount = computed(() => this._count());

  openComponent<T, R = unknown>(
    component: Type<T>,
    type: OverlayType,
    config: OverlayConfig = {},
  ): OverlayRef<R> {
    const id         = config.id ?? genId();
    const cdkConfig  = this.buildCdkConfig(type, config);
    const cdkRef     = this.cdkOverlay.create(cdkConfig);
    const portal     = new ComponentPortal(component, null, this.injector);

    cdkRef.attach(portal);

    let resolvePromise!: (value: R | undefined) => void;
    const afterClosedPromise = new Promise<R | undefined>(res => { resolvePromise = res; });

    const ref: OverlayRef<R> = {
      id,
      type,
      close: (result?: R) => this.close(id, result),
      afterClosed: () => afterClosedPromise,
    };

    const managed: ManagedOverlay = {
      cdkRef,
      ref,
      resolve: resolvePromise as unknown as (result: unknown) => void,
    };

    this._overlays.set(id, managed);
    this._count.set(this._overlays.size);

    if (config.closeOnBackdropClick !== false) {
      cdkRef.backdropClick().subscribe(() => this.close(id, undefined));
    }
    if (config.closeOnEscape !== false) {
      cdkRef.keydownEvents().subscribe(e => {
        if (e.key === 'Escape') this.close(id, undefined);
      });
    }

    return ref;
  }

  close<R = unknown>(id: string, result?: R): void {
    const managed = this._overlays.get(id);
    if (!managed) return;
    managed.cdkRef.dispose();
    managed.resolve(result);
    this._overlays.delete(id);
    this._count.set(this._overlays.size);
  }

  closeAll(): void {
    for (const id of this._overlays.keys()) {
      this.close(id, undefined);
    }
  }

  isOpen(id: string): boolean {
    return this._overlays.has(id);
  }

  getOpenIds(): ReadonlyArray<string> {
    return Array.from(this._overlays.keys());
  }

  private buildCdkConfig(type: OverlayType, config: OverlayConfig): CdkOverlayConfig {
    const position = this.buildPosition(type);
    const panelClasses = [
      `platform-overlay`,
      `platform-overlay-${type}`,
      ...(Array.isArray(config.panelClass)
        ? config.panelClass
        : config.panelClass ? [config.panelClass] : []),
    ];

    return new CdkOverlayConfig({
      hasBackdrop:     config.hasBackdrop ?? (type === 'dialog' || type === 'drawer'),
      backdropClass:   config.backdropClass ?? 'platform-overlay-backdrop',
      panelClass:      panelClasses,
      width:           config.width,
      height:          config.height,
      minWidth:        config.minWidth,
      maxWidth:        config.maxWidth ?? (type === 'dialog' ? '90vw' : undefined),
      positionStrategy: position,
      scrollStrategy:  type === 'tooltip' || type === 'popover'
        ? this.cdkOverlay.scrollStrategies.reposition()
        : this.cdkOverlay.scrollStrategies.block(),
    });
  }

  private buildPosition(type: OverlayType): GlobalPositionStrategy | FlexibleConnectedPositionStrategy {
    switch (type) {
      case 'dialog':
        return this.cdkOverlay.position().global().centerHorizontally().centerVertically();
      case 'drawer':
        return this.cdkOverlay.position().global().left('0').top('0').height('100%');
      default:
        return this.cdkOverlay.position().global().centerHorizontally().centerVertically();
    }
  }
}
