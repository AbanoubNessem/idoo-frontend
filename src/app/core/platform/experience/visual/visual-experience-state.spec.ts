import { TestBed } from '@angular/core/testing';
import { VisualExperienceState }  from './visual-experience-state';
import { ExperienceState }        from '../experience-state';
import { EXPERIENCE_INITIAL_STATE } from '../experience.tokens';
import {
  DEFAULT_TYPOGRAPHY_ID, DEFAULT_DENSITY_ID, DEFAULT_ICON_PACK_ID,
  DEFAULT_MOTION_ID, DEFAULT_ACCESSIBILITY_ID,
} from './visual.constants';

describe('VisualExperienceState', () => {
  let state: VisualExperienceState;
  let expState: ExperienceState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: EXPERIENCE_INITIAL_STATE, useValue: {} },
      ],
    });
    state    = TestBed.inject(VisualExperienceState);
    expState = TestBed.inject(ExperienceState);
  });

  // ─── Projected signals ────────────────────────────────────────────────────

  it('typographyId reflects ExperienceState', () => {
    TestBed.runInInjectionContext(() => {
      expState.setTypography('typography-arabic');
      expect(state.typographyId()).toBe('typography-arabic');
    });
  });

  it('densityId reflects ExperienceState', () => {
    TestBed.runInInjectionContext(() => {
      expState.setDensity('density-compact');
      expect(state.densityId()).toBe('density-compact');
    });
  });

  it('iconPackId reflects ExperienceState', () => {
    TestBed.runInInjectionContext(() => {
      expState.setIconPack('heroicons');
      expect(state.iconPackId()).toBe('heroicons');
    });
  });

  // ─── Visual-only signals ──────────────────────────────────────────────────

  it('has default motionId', () => {
    expect(state.motionId()).toBe(DEFAULT_MOTION_ID);
  });

  it('has default accessibilityId', () => {
    expect(state.accessibilityId()).toBe(DEFAULT_ACCESSIBILITY_ID);
  });

  it('reducedMotion defaults false', () => {
    expect(state.reducedMotion()).toBe(false);
  });

  it('largeTypography defaults false', () => {
    expect(state.largeTypography()).toBe(false);
  });

  it('focusVisible defaults false', () => {
    expect(state.focusVisible()).toBe(false);
  });

  // ─── Setters ─────────────────────────────────────────────────────────────

  it('setMotion updates motionId', () => {
    state.setMotion('motion-reduced');
    expect(state.motionId()).toBe('motion-reduced');
  });

  it('setAccessibility updates accessibilityId', () => {
    state.setAccessibility('accessibility-high-contrast');
    expect(state.accessibilityId()).toBe('accessibility-high-contrast');
  });

  it('setReducedMotion updates signal', () => {
    state.setReducedMotion(true);
    expect(state.reducedMotion()).toBe(true);
  });

  it('setLargeTypography updates signal', () => {
    state.setLargeTypography(true);
    expect(state.largeTypography()).toBe(true);
  });

  it('setFocusVisible updates signal', () => {
    state.setFocusVisible(true);
    expect(state.focusVisible()).toBe(true);
  });

  // ─── Reset ───────────────────────────────────────────────────────────────

  it('reset restores visual-only defaults', () => {
    state.setMotion('motion-reduced');
    state.setReducedMotion(true);
    state.setLargeTypography(true);
    state.setFocusVisible(true);
    state.setAccessibility('accessibility-full');

    state.reset();

    expect(state.motionId()).toBe(DEFAULT_MOTION_ID);
    expect(state.accessibilityId()).toBe(DEFAULT_ACCESSIBILITY_ID);
    expect(state.reducedMotion()).toBe(false);
    expect(state.largeTypography()).toBe(false);
    expect(state.focusVisible()).toBe(false);
  });
});
