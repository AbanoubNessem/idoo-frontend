import { Injectable, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BreakpointDefinition, BreakpointKey } from '../ui.types';

export const BREAKPOINTS: Readonly<Record<BreakpointKey, BreakpointDefinition>> = {
  xs:  { key: 'xs',  minWidthPx: 0,    maxWidthPx: 639,  mediaQuery: '(max-width: 639px)' },
  sm:  { key: 'sm',  minWidthPx: 640,  maxWidthPx: 767,  mediaQuery: '(min-width: 640px) and (max-width: 767px)' },
  md:  { key: 'md',  minWidthPx: 768,  maxWidthPx: 1023, mediaQuery: '(min-width: 768px) and (max-width: 1023px)' },
  lg:  { key: 'lg',  minWidthPx: 1024, maxWidthPx: 1279, mediaQuery: '(min-width: 1024px) and (max-width: 1279px)' },
  xl:  { key: 'xl',  minWidthPx: 1280, maxWidthPx: 1535, mediaQuery: '(min-width: 1280px) and (max-width: 1535px)' },
  '2xl': { key: '2xl', minWidthPx: 1536, maxWidthPx: null, mediaQuery: '(min-width: 1536px)' },
};

export const MIN_WIDTH_QUERIES: Record<BreakpointKey, string> = {
  xs:  '(min-width: 0px)',
  sm:  '(min-width: 640px)',
  md:  '(min-width: 768px)',
  lg:  '(min-width: 1024px)',
  xl:  '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

@Injectable({ providedIn: 'root' })
export class BreakpointService implements OnDestroy {
  private readonly observer   = inject(BreakpointObserver);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _destroy$  = new Subject<void>();

  private readonly _active = new Map<string, boolean>();
  private readonly _change$ = new Subject<BreakpointState>();

  readonly change$ = this._change$.asObservable();

  private _subscription: Subscription | null = null;

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this._subscription) return;

    const queries = Object.values(BREAKPOINTS).map(b => b.mediaQuery);

    this._subscription = this.observer
      .observe(queries)
      .pipe(takeUntil(this._destroy$))
      .subscribe(state => {
        for (const [query, matched] of Object.entries(state.breakpoints)) {
          this._active.set(query, matched);
        }
        this._change$.next(state);
      });
  }

  isMatched(query: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this.observer.isMatched(query);
  }

  isBreakpointActive(key: BreakpointKey): boolean {
    const bp = BREAKPOINTS[key];
    return this.isMatched(bp.mediaQuery);
  }

  isAtLeast(key: BreakpointKey): boolean {
    return this.isMatched(MIN_WIDTH_QUERIES[key]);
  }

  currentBreakpoint(): BreakpointKey {
    const keys: BreakpointKey[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    for (const key of keys) {
      if (this.isBreakpointActive(key)) return key;
    }
    // Fallback: widest that matches min-width
    for (const key of keys) {
      if (this.isAtLeast(key)) return key;
    }
    return 'xs';
  }

  getDefinition(key: BreakpointKey): BreakpointDefinition {
    return BREAKPOINTS[key];
  }

  getAllDefinitions(): ReadonlyArray<BreakpointDefinition> {
    return Object.values(BREAKPOINTS);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
