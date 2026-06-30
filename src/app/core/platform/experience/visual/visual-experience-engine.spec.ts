import { TestBed } from '@angular/core/testing';
import { VisualExperienceEngineService } from './visual-experience-engine.service';
import { VisualExperienceState }         from './visual-experience-state';
import { EXPERIENCE_INITIAL_STATE }      from '../experience.tokens';
import { VISUAL_AUTO_APPLY }             from './visual.tokens';
import {
  DEFAULT_TYPOGRAPHY_ID, DEFAULT_DENSITY_ID, DEFAULT_ICON_PACK_ID,
  DEFAULT_MOTION_ID, DEFAULT_ACCESSIBILITY_ID,
} from './visual.constants';

describe('VisualExperienceEngineService', () => {
  let engine: VisualExperienceEngineService;
  let state:  VisualExperienceState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: EXPERIENCE_INITIAL_STATE, useValue: {} },
        { provide: VISUAL_AUTO_APPLY,        useValue: false },  // disable DOM writes in tests
      ],
    });
    engine = TestBed.inject(VisualExperienceEngineService);
    state  = TestBed.inject(VisualExperienceState);
  });

  // ─── Signals ─────────────────────────────────────────────────────────────

  it('effectiveVisual resolves to built-in defaults', () => {
    const eff = TestBed.runInInjectionContext(() => engine.effectiveVisual());
    expect(eff.typography.id).toBe(DEFAULT_TYPOGRAPHY_ID);
    expect(eff.density.id).toBe(DEFAULT_DENSITY_ID);
    expect(eff.iconPack.id).toBe(DEFAULT_ICON_PACK_ID);
    expect(eff.motion.id).toBe(DEFAULT_MOTION_ID);
    expect(eff.accessibility.id).toBe(DEFAULT_ACCESSIBILITY_ID);
  });

  // ─── Typography ──────────────────────────────────────────────────────────

  it('setTypography updates effectiveVisual.typography', () => {
    TestBed.runInInjectionContext(() => {
      engine.setTypography('typography-arabic');
      expect(engine.effectiveVisual().typography.id).toBe('typography-arabic');
    });
  });

  // ─── Density ─────────────────────────────────────────────────────────────

  it('setDensity updates effectiveVisual.density', () => {
    TestBed.runInInjectionContext(() => {
      engine.setDensity('density-compact');
      expect(engine.effectiveVisual().density.id).toBe('density-compact');
      expect(engine.effectiveVisual().density.level).toBe('compact');
    });
  });

  // ─── Icon Pack ────────────────────────────────────────────────────────────

  it('setIconPack updates effectiveVisual.iconPack', () => {
    TestBed.runInInjectionContext(() => {
      engine.setIconPack('heroicons');
      expect(engine.effectiveVisual().iconPack.id).toBe('heroicons');
    });
  });

  // ─── Motion ──────────────────────────────────────────────────────────────

  it('setMotion updates effectiveVisual.motion', () => {
    TestBed.runInInjectionContext(() => {
      engine.setMotion('motion-reduced');
      expect(engine.effectiveVisual().motion.id).toBe('motion-reduced');
      expect(engine.effectiveVisual().motion.reducedMotion).toBe(true);
    });
  });

  it('setMotion syncs reducedMotion flag', () => {
    engine.setMotion('motion-reduced');
    expect(state.reducedMotion()).toBe(true);
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  it('setAccessibility applies full profile flags', () => {
    engine.setAccessibility('accessibility-full');
    expect(state.reducedMotion()).toBe(true);
    expect(state.largeTypography()).toBe(true);
    expect(state.focusVisible()).toBe(true);
  });

  it('setAccessibility to high-contrast enables focusVisible', () => {
    engine.setAccessibility('accessibility-high-contrast');
    expect(state.focusVisible()).toBe(true);
    expect(state.reducedMotion()).toBe(false);
  });

  // ─── setReducedMotion ─────────────────────────────────────────────────────

  it('setReducedMotion(true) switches to motion-reduced profile', () => {
    TestBed.runInInjectionContext(() => {
      engine.setReducedMotion(true);
      expect(engine.effectiveVisual().motion.id).toBe('motion-reduced');
    });
  });

  it('setReducedMotion(false) switches back to normal motion', () => {
    TestBed.runInInjectionContext(() => {
      engine.setMotion('motion-reduced');
      engine.setReducedMotion(false);
      expect(engine.effectiveVisual().motion.id).toBe(DEFAULT_MOTION_ID);
    });
  });

  // ─── setLargeTypography ───────────────────────────────────────────────────

  it('setLargeTypography(true) switches to typography-large', () => {
    TestBed.runInInjectionContext(() => {
      engine.setLargeTypography(true);
      expect(engine.effectiveVisual().typography.id).toBe('typography-large');
    });
  });

  // ─── Events ──────────────────────────────────────────────────────────────

  it('setTypography emits typography:changed event', (done) => {
    const { VisualExperienceEventsService } = require('./visual-experience-events.service');
    const events = TestBed.inject(VisualExperienceEventsService);
    events.on('typography:changed').subscribe((e: { id: string }) => {
      expect(e.id).toBe('typography-arabic');
      done();
    });
    engine.setTypography('typography-arabic');
  });

  // ─── Reset ───────────────────────────────────────────────────────────────

  it('reset restores defaults', () => {
    TestBed.runInInjectionContext(() => {
      engine.setTypography('typography-arabic');
      engine.setDensity('density-compact');
      engine.setIconPack('heroicons');
      engine.reset();
      expect(engine.effectiveVisual().typography.id).toBe(DEFAULT_TYPOGRAPHY_ID);
      expect(engine.effectiveVisual().density.id).toBe(DEFAULT_DENSITY_ID);
      expect(engine.effectiveVisual().iconPack.id).toBe(DEFAULT_ICON_PACK_ID);
    });
  });

  // ─── Diagnostics ─────────────────────────────────────────────────────────

  it('diagnosticsReport returns valid report', () => {
    const report = engine.diagnosticsReport();
    expect(report.registeredProfiles.typography).toBeGreaterThan(0);
    expect(report.generatedAt).toBeTruthy();
  });

  // ─── Metrics ─────────────────────────────────────────────────────────────

  it('metricsSnapshot returns valid snapshot', () => {
    const snap = engine.metricsSnapshot();
    expect(typeof snap.applyCount).toBe('number');
    expect(snap.initializedAt).toBeTruthy();
  });
});
