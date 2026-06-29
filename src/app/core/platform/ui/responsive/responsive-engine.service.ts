import { Injectable, inject, signal, computed, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BreakpointKey, DeviceClass, ViewportState } from '../ui.types';
import { BreakpointService } from './breakpoint.service';

function deviceFor(key: BreakpointKey): DeviceClass {
  if (key === 'xs' || key === 'sm') return 'mobile';
  if (key === 'md') return 'tablet';
  return 'desktop';
}

@Injectable({ providedIn: 'root' })
export class ResponsiveEngineService implements OnDestroy {
  private readonly bp         = inject(BreakpointService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _destroy$  = new Subject<void>();

  private readonly _breakpoint = signal<BreakpointKey>('lg');
  private readonly _widthPx    = signal(1024);
  private readonly _portrait   = signal(false);

  readonly breakpoint = computed(() => this._breakpoint());
  readonly device     = computed<DeviceClass>(() => deviceFor(this._breakpoint()));
  readonly isMobile   = computed(() => this.device() === 'mobile');
  readonly isTablet   = computed(() => this.device() === 'tablet');
  readonly isDesktop  = computed(() => this.device() === 'desktop');
  readonly isPortrait = computed(() => this._portrait());
  readonly isLandscape= computed(() => !this._portrait());

  readonly viewportState = computed<ViewportState>(() => ({
    breakpoint: this._breakpoint(),
    device:     this.device(),
    widthPx:    this._widthPx(),
    isPortrait: this._portrait(),
    isLandscape: !this._portrait(),
  }));

  initialize(): void {
    this.bp.initialize();

    if (isPlatformBrowser(this.platformId)) {
      this.refresh();

      this.bp.change$
        .pipe(takeUntil(this._destroy$))
        .subscribe(() => this.refresh());

      window.addEventListener('resize', () => this.refresh());
    }
  }

  private refresh(): void {
    this._breakpoint.set(this.bp.currentBreakpoint());
    if (isPlatformBrowser(this.platformId)) {
      this._widthPx.set(window.innerWidth);
      this._portrait.set(window.innerHeight > window.innerWidth);
    }
  }

  isAtLeast(key: BreakpointKey): boolean {
    return this.bp.isAtLeast(key);
  }

  isAtMost(key: BreakpointKey): boolean {
    const order: BreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const current = order.indexOf(this._breakpoint());
    const target  = order.indexOf(key);
    return current <= target;
  }

  getViewportWidth(): number {
    return this._widthPx();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
