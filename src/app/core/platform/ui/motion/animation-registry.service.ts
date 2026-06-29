import { Injectable, signal, computed } from '@angular/core';
import { AnimationSpec, AnimationDuration, EasingFunction } from '../ui.types';

const DURATION_MS: Record<AnimationDuration, number> = {
  instant:   0,
  fast:      100,
  medium:    200,
  slow:      350,
  'very-slow': 500,
};

const EASING_FUNCTIONS: Record<EasingFunction, string> = {
  linear:      'linear',
  ease:        'ease',
  'ease-in':   'ease-in',
  'ease-out':  'ease-out',
  'ease-in-out': 'ease-in-out',
  standard:    'cubic-bezier(0.2, 0, 0, 1)',
  decelerate:  'cubic-bezier(0, 0, 0, 1)',
  accelerate:  'cubic-bezier(0.3, 0, 1, 1)',
  sharp:       'cubic-bezier(0.2, 0, 0, 1)',
};

const BUILT_IN_ANIMATIONS: AnimationSpec[] = [
  {
    name: 'fade-in',
    duration: 'medium',
    easing: 'ease-out',
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  },
  {
    name: 'fade-out',
    duration: 'medium',
    easing: 'ease-in',
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
  },
  {
    name: 'slide-in-up',
    duration: 'medium',
    easing: 'decelerate',
    keyframes: [
      { transform: 'translateY(16px)', opacity: 0 },
      { transform: 'translateY(0)',    opacity: 1 },
    ],
  },
  {
    name: 'slide-in-down',
    duration: 'medium',
    easing: 'decelerate',
    keyframes: [
      { transform: 'translateY(-16px)', opacity: 0 },
      { transform: 'translateY(0)',     opacity: 1 },
    ],
  },
  {
    name: 'slide-out-up',
    duration: 'fast',
    easing: 'accelerate',
    keyframes: [
      { transform: 'translateY(0)',     opacity: 1 },
      { transform: 'translateY(-16px)', opacity: 0 },
    ],
  },
  {
    name: 'slide-in-right',
    duration: 'medium',
    easing: 'decelerate',
    keyframes: [
      { transform: 'translateX(100%)', opacity: 0 },
      { transform: 'translateX(0)',    opacity: 1 },
    ],
  },
  {
    name: 'slide-in-left',
    duration: 'medium',
    easing: 'decelerate',
    keyframes: [
      { transform: 'translateX(-100%)', opacity: 0 },
      { transform: 'translateX(0)',     opacity: 1 },
    ],
  },
  {
    name: 'scale-in',
    duration: 'medium',
    easing: 'decelerate',
    keyframes: [
      { transform: 'scale(0.9)', opacity: 0 },
      { transform: 'scale(1)',   opacity: 1 },
    ],
  },
  {
    name: 'scale-out',
    duration: 'fast',
    easing: 'accelerate',
    keyframes: [
      { transform: 'scale(1)',   opacity: 1 },
      { transform: 'scale(0.9)', opacity: 0 },
    ],
  },
  {
    name: 'dialog-in',
    duration: 'medium',
    easing: 'decelerate',
    keyframes: [
      { transform: 'scale(0.95) translateY(-8px)', opacity: 0 },
      { transform: 'scale(1) translateY(0)',       opacity: 1 },
    ],
  },
  {
    name: 'drawer-in-right',
    duration: 'slow',
    easing: 'decelerate',
    keyframes: [
      { transform: 'translateX(100%)' },
      { transform: 'translateX(0)' },
    ],
  },
  {
    name: 'drawer-in-left',
    duration: 'slow',
    easing: 'decelerate',
    keyframes: [
      { transform: 'translateX(-100%)' },
      { transform: 'translateX(0)' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class AnimationRegistryService {
  private readonly _animations = new Map<string, AnimationSpec>();
  private readonly _count      = signal(0);

  readonly animationCount = computed(() => this._count());

  constructor() {
    for (const anim of BUILT_IN_ANIMATIONS) {
      this._animations.set(anim.name, anim);
    }
    this._count.set(this._animations.size);
  }

  register(spec: AnimationSpec): void {
    if (!spec.name?.trim()) throw new Error('AnimationRegistry: animation name is required');
    this._animations.set(spec.name, spec);
    this._count.set(this._animations.size);
  }

  get(name: string): AnimationSpec | null {
    return this._animations.get(name) ?? null;
  }

  has(name: string): boolean {
    return this._animations.has(name);
  }

  getAll(): ReadonlyArray<AnimationSpec> {
    return Array.from(this._animations.values());
  }

  remove(name: string): boolean {
    const existed = this._animations.delete(name);
    if (existed) this._count.set(this._animations.size);
    return existed;
  }

  resolveDuration(duration: AnimationDuration | number, multiplier = 1): number {
    const base = typeof duration === 'number' ? duration : DURATION_MS[duration];
    return Math.round(base * multiplier);
  }

  resolveEasing(easing: EasingFunction): string {
    return EASING_FUNCTIONS[easing] ?? easing;
  }

  getBuiltInNames(): ReadonlyArray<string> {
    return BUILT_IN_ANIMATIONS.map(a => a.name);
  }
}
