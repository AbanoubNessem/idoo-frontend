import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnimationHandle, AnimationSpec, MotionConfig, AnimationDuration, EasingFunction } from '../ui.types';
import { AnimationRegistryService } from './animation-registry.service';
import { AccessibilityService } from '../accessibility/accessibility.service';

function genId(): string {
  return 'anim-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

@Injectable({ providedIn: 'root' })
export class MotionEngineService {
  private readonly registry    = inject(AnimationRegistryService);
  private readonly a11y        = inject(AccessibilityService);
  private readonly platformId  = inject(PLATFORM_ID);

  private readonly _running = new Map<string, Animation>();
  private readonly _config  = signal<MotionConfig>({
    reducedMotion:    false,
    durationMultiplier: 1,
    defaultDuration:  'medium',
    defaultEasing:    'standard',
  });

  readonly config = this._config.asReadonly();
  readonly reducedMotion = computed(() => this._config().reducedMotion || this.a11y.reducedMotion());

  initialize(): void {
    this._config.update(cfg => ({
      ...cfg,
      reducedMotion: this.a11y.reducedMotion(),
    }));
  }

  play(
    element: HTMLElement,
    nameOrSpec: string | AnimationSpec,
    overrides?: Partial<AnimationSpec>,
  ): AnimationHandle {
    const id = genId();

    if (!isPlatformBrowser(this.platformId)) {
      return this.noop(id, typeof nameOrSpec === 'string' ? nameOrSpec : nameOrSpec.name);
    }

    const spec = typeof nameOrSpec === 'string'
      ? this.registry.get(nameOrSpec)
      : nameOrSpec;

    if (!spec) {
      return this.noop(id, typeof nameOrSpec === 'string' ? nameOrSpec : 'unknown');
    }

    const merged: AnimationSpec = { ...spec, ...overrides };

    const cfg = this._config();
    const durationMs = this.reducedMotion()
      ? 0
      : this.registry.resolveDuration(merged.duration, cfg.durationMultiplier);

    const easingCss = this.registry.resolveEasing(merged.easing);
    const keyframes = merged.keyframes as unknown as PropertyIndexedKeyframes;

    let webAnimation: Animation;
    try {
      webAnimation = element.animate(keyframes, {
        duration: durationMs,
        easing:   easingCss,
        fill:     'forwards',
        ...merged.options,
      });
      this._running.set(id, webAnimation);
      webAnimation.onfinish = () => this._running.delete(id);
      webAnimation.oncancel = () => this._running.delete(id);
    } catch {
      return this.noop(id, spec.name);
    }

    return {
      id,
      name: spec.name,
      cancel: () => {
        webAnimation.cancel();
        this._running.delete(id);
      },
      finish: () => new Promise<void>((resolve) => {
        webAnimation.onfinish = () => { this._running.delete(id); resolve(); };
        webAnimation.finish();
      }),
    };
  }

  playNamed(element: HTMLElement, name: string): AnimationHandle {
    return this.play(element, name);
  }

  cancelAll(): void {
    for (const anim of this._running.values()) {
      try { anim.cancel(); } catch { /* ignore */ }
    }
    this._running.clear();
  }

  setDurationMultiplier(multiplier: number): void {
    this._config.update(cfg => ({ ...cfg, durationMultiplier: multiplier }));
  }

  setReducedMotion(value: boolean): void {
    this._config.update(cfg => ({ ...cfg, reducedMotion: value }));
  }

  isRunning(id: string): boolean {
    return this._running.has(id);
  }

  getRunningCount(): number {
    return this._running.size;
  }

  private noop(id: string, name: string): AnimationHandle {
    return {
      id,
      name,
      cancel: () => {},
      finish: () => Promise.resolve(),
    };
  }
}
