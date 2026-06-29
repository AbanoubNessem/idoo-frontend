import { Injectable, inject, signal, computed, Type } from '@angular/core';
import { DrawerConfig, DrawerPosition, OverlayRef } from '../ui.types';
import { OverlayManagerService } from './overlay-manager.service';

const DRAWER_WIDTH: Record<DrawerPosition, string | undefined> = {
  start:  '320px',
  end:    '320px',
  top:    '100vw',
  bottom: '100vw',
};

const DRAWER_HEIGHT: Record<DrawerPosition, string | undefined> = {
  start:  '100vh',
  end:    '100vh',
  top:    '320px',
  bottom: '320px',
};

@Injectable({ providedIn: 'root' })
export class DrawerHostService {
  private readonly manager = inject(OverlayManagerService);

  private readonly _openDrawers = signal<ReadonlyArray<string>>([]);
  readonly openDrawers  = computed(() => this._openDrawers());
  readonly drawerCount  = computed(() => this._openDrawers().length);

  open<T, D = unknown, R = unknown>(
    component: Type<T>,
    config: DrawerConfig<D> = {},
  ): OverlayRef<R> {
    const position = config.position ?? 'end';
    const ref = this.manager.openComponent<T, R>(component, 'drawer', {
      ...config,
      width:       DRAWER_WIDTH[position],
      height:      DRAWER_HEIGHT[position],
      hasBackdrop: config.mode !== 'side',
      panelClass:  ['platform-drawer', `platform-drawer-${position}`],
    });

    this._openDrawers.update(ids => [...ids, ref.id]);
    ref.afterClosed().then(() => {
      this._openDrawers.update(ids => ids.filter(id => id !== ref.id));
    });

    return ref;
  }

  closeAll(): void {
    this.manager.closeAll();
    this._openDrawers.set([]);
  }
}
