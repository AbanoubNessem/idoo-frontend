import { Injectable, inject, signal, computed, Type } from '@angular/core';
import { DialogConfig, OverlayRef, DialogSize } from '../ui.types';
import { OverlayManagerService } from './overlay-manager.service';

const SIZE_WIDTHS: Record<DialogSize, string> = {
  xs:         '320px',
  sm:         '480px',
  md:         '600px',
  lg:         '800px',
  xl:         '1024px',
  fullscreen: '100vw',
};

@Injectable({ providedIn: 'root' })
export class DialogHostService {
  private readonly manager = inject(OverlayManagerService);

  private readonly _openDialogs = signal<ReadonlyArray<string>>([]);
  readonly openDialogs  = computed(() => this._openDialogs());
  readonly dialogCount  = computed(() => this._openDialogs().length);
  readonly hasOpenDialog = computed(() => this._openDialogs().length > 0);

  open<T, D = unknown, R = unknown>(
    component: Type<T>,
    config: DialogConfig<D> = {},
  ): OverlayRef<R> {
    const size   = config.size ?? 'md';
    const width  = config.width ?? SIZE_WIDTHS[size];
    const height = size === 'fullscreen' ? '100vh' : config.height;

    const ref = this.manager.openComponent<T, R>(component, 'dialog', {
      ...config,
      width,
      height,
      hasBackdrop: true,
      closeOnBackdropClick: !config.disableClose,
      closeOnEscape:        !config.disableClose,
      panelClass: ['platform-dialog', ...(config.panelClass
        ? (Array.isArray(config.panelClass) ? config.panelClass : [config.panelClass])
        : [])],
    });

    this._openDialogs.update(ids => [...ids, ref.id]);

    ref.afterClosed().then(() => {
      this._openDialogs.update(ids => ids.filter(id => id !== ref.id));
    });

    return ref;
  }

  closeAll(): void {
    this.manager.closeAll();
    this._openDialogs.set([]);
  }

  isOpen(id: string): boolean {
    return this.manager.isOpen(id);
  }
}
