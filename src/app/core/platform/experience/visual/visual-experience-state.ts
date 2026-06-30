import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { ExperienceState } from '../experience-state';
import {
  DEFAULT_MOTION_ID, DEFAULT_ACCESSIBILITY_ID,
} from './visual.constants';

/**
 * Visual-only signal store.
 *
 * - typographyId / densityId / iconPackId are computed projections from ExperienceState
 *   (single source of truth, no duplication).
 * - motionId / accessibilityId / reducedMotion / largeTypography / focusVisible
 *   are owned here because ExperienceState does not track them.
 */
@Injectable({ providedIn: 'root' })
export class VisualExperienceState {
  private readonly _expState = inject(ExperienceState);

  // ─── Projected from ExperienceState ──────────────────────────────────────

  /** Active typography profile id — owned by ExperienceState */
  readonly typographyId: Signal<string | null> = computed(() => {
    const id = this._expState.typographyId();
    return id || null;
  });

  /** Active density profile id — owned by ExperienceState */
  readonly densityId: Signal<string> = computed(() => this._expState.densityId());

  /** Active icon pack profile id — owned by ExperienceState */
  readonly iconPackId: Signal<string> = computed(() => this._expState.iconPackId());

  // ─── Visual-only writable signals ────────────────────────────────────────

  private readonly _motionId         = signal<string>(DEFAULT_MOTION_ID);
  private readonly _accessibilityId  = signal<string>(DEFAULT_ACCESSIBILITY_ID);
  private readonly _reducedMotion    = signal<boolean>(false);
  private readonly _largeTypography  = signal<boolean>(false);
  private readonly _focusVisible     = signal<boolean>(false);

  readonly motionId:        Signal<string>  = this._motionId.asReadonly();
  readonly accessibilityId: Signal<string>  = this._accessibilityId.asReadonly();
  readonly reducedMotion:   Signal<boolean> = this._reducedMotion.asReadonly();
  readonly largeTypography: Signal<boolean> = this._largeTypography.asReadonly();
  readonly focusVisible:    Signal<boolean> = this._focusVisible.asReadonly();

  // ─── Setters ─────────────────────────────────────────────────────────────

  setMotion(id: string):              void { this._motionId.set(id); }
  setAccessibility(id: string):       void { this._accessibilityId.set(id); }
  setReducedMotion(value: boolean):   void { this._reducedMotion.set(value); }
  setLargeTypography(value: boolean): void { this._largeTypography.set(value); }
  setFocusVisible(value: boolean):    void { this._focusVisible.set(value); }

  reset(): void {
    this._motionId.set(DEFAULT_MOTION_ID);
    this._accessibilityId.set(DEFAULT_ACCESSIBILITY_ID);
    this._reducedMotion.set(false);
    this._largeTypography.set(false);
    this._focusVisible.set(false);
  }
}
