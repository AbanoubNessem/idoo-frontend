import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { A11yState, AnnouncePoliteness, AriaRole } from '../ui.types';

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly platformId    = inject(PLATFORM_ID);

  private readonly _highContrast  = signal(false);
  private readonly _reducedMotion = signal(false);
  private readonly _forcedColors  = signal(false);

  readonly a11yState = computed<A11yState>(() => ({
    highContrast:  this._highContrast(),
    reducedMotion: this._reducedMotion(),
    forcedColors:  this._forcedColors(),
    screenReader:  false, // Not detectable via JS; set by consumer if known
  }));

  readonly reducedMotion = computed(() => this._reducedMotion());
  readonly highContrast  = computed(() => this._highContrast());

  private _motionQuery: MediaQueryList | null  = null;
  private _contrastQuery: MediaQueryList | null = null;
  private _colorsQuery: MediaQueryList | null   = null;

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this._motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._reducedMotion.set(this._motionQuery.matches);
    this._motionQuery.addEventListener('change', (e) => this._reducedMotion.set(e.matches));

    this._contrastQuery = window.matchMedia('(prefers-contrast: more)');
    this._highContrast.set(this._contrastQuery.matches);
    this._contrastQuery.addEventListener('change', (e) => this._highContrast.set(e.matches));

    this._colorsQuery = window.matchMedia('(forced-colors: active)');
    this._forcedColors.set(this._colorsQuery.matches);
    this._colorsQuery.addEventListener('change', (e) => this._forcedColors.set(e.matches));
  }

  // ─── Announcements ────────────────────────────────────────────────────────

  announce(message: string, politeness: AnnouncePoliteness = 'polite'): Promise<void> {
    if (politeness === 'off') return Promise.resolve();
    return this.liveAnnouncer.announce(message, politeness);
  }

  announceError(message: string): Promise<void> {
    return this.announce(message, 'assertive');
  }

  clearAnnouncement(): void {
    this.liveAnnouncer.clear();
  }

  // ─── ARIA Helpers ─────────────────────────────────────────────────────────

  setAriaLabel(el: HTMLElement, label: string): void {
    el.setAttribute('aria-label', label);
  }

  setAriaRole(el: HTMLElement, role: AriaRole): void {
    el.setAttribute('role', role);
  }

  setAriaExpanded(el: HTMLElement, expanded: boolean): void {
    el.setAttribute('aria-expanded', String(expanded));
  }

  setAriaHidden(el: HTMLElement, hidden: boolean): void {
    el.setAttribute('aria-hidden', String(hidden));
  }

  setAriaLive(el: HTMLElement, politeness: AnnouncePoliteness): void {
    el.setAttribute('aria-live', politeness);
  }

  setAriaDescribedBy(el: HTMLElement, targetId: string): void {
    el.setAttribute('aria-describedby', targetId);
  }

  setAriaLabelledBy(el: HTMLElement, targetId: string): void {
    el.setAttribute('aria-labelledby', targetId);
  }

  setAriaSelected(el: HTMLElement, selected: boolean): void {
    el.setAttribute('aria-selected', String(selected));
  }

  setAriaCurrent(el: HTMLElement, current: boolean | 'page' | 'step' | 'location' | 'date' | 'time'): void {
    el.setAttribute('aria-current', String(current));
  }

  // ─── High Contrast ────────────────────────────────────────────────────────

  applyHighContrastClass(el: HTMLElement, className = 'platform-high-contrast'): void {
    if (this._highContrast()) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  }

  // ─── Skip Link ────────────────────────────────────────────────────────────

  createSkipLink(targetId: string, label = 'Skip to main content'): HTMLAnchorElement | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.textContent = label;
    link.className = 'platform-skip-link';
    link.style.cssText = [
      'position:absolute', 'top:-40px', 'left:0', 'z-index:99999',
      'padding:8px 16px', 'background:var(--platform-color-primary,#2563eb)',
      'color:#fff', 'border-radius:0 0 4px 0', 'text-decoration:none',
      'transition:top 0.1s',
    ].join(';');
    link.addEventListener('focus', () => { link.style.top = '0'; });
    link.addEventListener('blur',  () => { link.style.top = '-40px'; });
    return link;
  }
}
