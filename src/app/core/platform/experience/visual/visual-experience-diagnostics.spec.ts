import { TestBed } from '@angular/core/testing';
import { VisualExperienceDiagnosticsService } from './visual-experience-diagnostics.service';
import { EXPERIENCE_INITIAL_STATE }           from '../experience.tokens';
import {
  DEFAULT_TYPOGRAPHY_ID, DEFAULT_DENSITY_ID, DEFAULT_ICON_PACK_ID,
  DEFAULT_MOTION_ID, DEFAULT_ACCESSIBILITY_ID,
} from './visual.constants';

describe('VisualExperienceDiagnosticsService', () => {
  let service: VisualExperienceDiagnosticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EXPERIENCE_INITIAL_STATE, useValue: {} }],
    });
    service = TestBed.inject(VisualExperienceDiagnosticsService);
  });

  it('report contains registeredProfiles for all dimensions', () => {
    const report = service.report();
    expect(report.registeredProfiles.typography).toBeGreaterThan(0);
    expect(report.registeredProfiles.density).toBeGreaterThan(0);
    expect(report.registeredProfiles['icon-pack']).toBeGreaterThan(0);
    expect(report.registeredProfiles.motion).toBeGreaterThan(0);
    expect(report.registeredProfiles.accessibility).toBeGreaterThan(0);
  });

  it('report.activeIds reflect defaults', () => {
    const report = service.report();
    expect(report.activeIds.typographyId).toBe(DEFAULT_TYPOGRAPHY_ID);
    expect(report.activeIds.densityId).toBe(DEFAULT_DENSITY_ID);
    expect(report.activeIds.iconPackId).toBe(DEFAULT_ICON_PACK_ID);
    expect(report.activeIds.motionId).toBe(DEFAULT_MOTION_ID);
    expect(report.activeIds.accessibilityId).toBe(DEFAULT_ACCESSIBILITY_ID);
  });

  it('report.accessibility flags default to false', () => {
    const report = service.report();
    expect(report.accessibility.reducedMotion).toBe(false);
    expect(report.accessibility.largeTypography).toBe(false);
    expect(report.accessibility.focusVisible).toBe(false);
  });

  it('report.metrics is a valid snapshot', () => {
    const report = service.report();
    expect(report.metrics).toBeTruthy();
    expect(typeof report.metrics.applyCount).toBe('number');
  });

  it('report.generatedAt is ISO string', () => {
    const report = service.report();
    expect(() => new Date(report.generatedAt)).not.toThrow();
  });
});
