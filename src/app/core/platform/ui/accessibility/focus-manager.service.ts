import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';
import { KeyboardShortcut } from '../ui.types';

interface FocusTrapEntry {
  trap: FocusTrap;
  element: HTMLElement;
  previousFocus: HTMLElement | null;
}

@Injectable({ providedIn: 'root' })
export class FocusManagerService {
  private readonly platformId       = inject(PLATFORM_ID);
  private readonly focusTrapFactory = inject(FocusTrapFactory);

  private readonly _trapStack: FocusTrapEntry[]     = [];
  private readonly _shortcuts = new Map<string, KeyboardShortcut>();
  private _shortcutListener: ((e: KeyboardEvent) => void) | null = null;

  // ─── Focus Trap ───────────────────────────────────────────────────────────

  trapFocus(element: HTMLElement): FocusTrap {
    if (!isPlatformBrowser(this.platformId)) return null as never;

    const previousFocus = document.activeElement as HTMLElement | null;
    const trap = this.focusTrapFactory.create(element);
    trap.focusInitialElementWhenReady();

    this._trapStack.push({ trap, element, previousFocus });
    return trap;
  }

  releaseFocus(element: HTMLElement): void {
    const idx = this._trapStack.findIndex(e => e.element === element);
    if (idx === -1) return;

    const [entry] = this._trapStack.splice(idx, 1);
    entry.trap.destroy();

    // Restore focus to the element that had focus before the trap was created
    if (entry.previousFocus && isPlatformBrowser(this.platformId)) {
      try { entry.previousFocus.focus(); } catch { /* element may be gone */ }
    }
  }

  releaseAll(): void {
    while (this._trapStack.length > 0) {
      const entry = this._trapStack.pop()!;
      entry.trap.destroy();
      try { entry.previousFocus?.focus(); } catch { /* ignore */ }
    }
  }

  hasActiveTrap(): boolean {
    return this._trapStack.length > 0;
  }

  // ─── Focus Movement ───────────────────────────────────────────────────────

  focusFirst(container: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) focusable[0].focus();
  }

  focusLast(container: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) focusable[focusable.length - 1].focus();
  }

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(container.querySelectorAll<HTMLElement>(selectors));
  }

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────────

  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.shortcutKey(shortcut);
    this._shortcuts.set(key, shortcut);
    this.ensureShortcutListener();
  }

  unregisterShortcut(shortcut: Omit<KeyboardShortcut, 'action' | 'description'>): void {
    const key = this.shortcutKey(shortcut as KeyboardShortcut);
    this._shortcuts.delete(key);
  }

  clearShortcuts(): void {
    this._shortcuts.clear();
    this.removeShortcutListener();
  }

  private shortcutKey(s: KeyboardShortcut): string {
    const mods = [...(s.modifiers ?? [])].sort().join('+');
    return mods ? `${mods}+${s.key}` : s.key;
  }

  private ensureShortcutListener(): void {
    if (!isPlatformBrowser(this.platformId) || this._shortcutListener) return;

    this._shortcutListener = (e: KeyboardEvent) => {
      const mods: string[] = [];
      if (e.ctrlKey)  mods.push('ctrl');
      if (e.altKey)   mods.push('alt');
      if (e.shiftKey) mods.push('shift');
      if (e.metaKey)  mods.push('meta');
      const key = (mods.length ? mods.sort().join('+') + '+' : '') + e.key;
      const shortcut = this._shortcuts.get(key);
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', this._shortcutListener);
  }

  private removeShortcutListener(): void {
    if (!isPlatformBrowser(this.platformId) || !this._shortcutListener) return;
    document.removeEventListener('keydown', this._shortcutListener);
    this._shortcutListener = null;
  }

  destroy(): void {
    this.releaseAll();
    this.clearShortcuts();
  }
}
