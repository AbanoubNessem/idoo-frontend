import { TestBed } from '@angular/core/testing';
import { ExperienceMetricsService } from '../experience-metrics.service';
import { EXPERIENCE_DIAGNOSTICS_ENABLED } from '../experience.tokens';

describe('ExperienceMetricsService (enabled)', () => {
  let service: ExperienceMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EXPERIENCE_DIAGNOSTICS_ENABLED, useValue: true }],
    });
    service = TestBed.inject(ExperienceMetricsService);
  });

  it('starts with 0 apply count', () => {
    expect(service.snapshot().applyCount).toBe(0);
  });

  it('recordApply increments count', () => {
    service.recordApply(10);
    service.recordApply(20);
    const snap = service.snapshot();
    expect(snap.applyCount).toBe(2);
    expect(snap.lastApplyMs).toBe(20);
    expect(snap.avgApplyMs).toBe(15);
  });

  it('recordChange increments dimension counter', () => {
    service.recordChange('theme');
    service.recordChange('theme');
    service.recordChange('language');
    const snap = service.snapshot();
    expect(snap.changeCount['theme']).toBe(2);
    expect(snap.changeCount['language']).toBe(1);
  });

  it('recordError increments error count', () => {
    service.recordError();
    expect(service.snapshot().errorCount).toBe(1);
  });

  it('reset() zeroes all counters', () => {
    service.recordApply(5);
    service.recordChange('density');
    service.reset();
    const snap = service.snapshot();
    expect(snap.applyCount).toBe(0);
    expect(snap.changeCount['density']).toBe(0);
  });
});

describe('ExperienceMetricsService (disabled)', () => {
  it('does nothing when diagnostics disabled', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: EXPERIENCE_DIAGNOSTICS_ENABLED, useValue: false }],
    });
    const service = TestBed.inject(ExperienceMetricsService);
    service.recordApply(50);
    service.recordChange('theme');
    expect(service.snapshot().applyCount).toBe(0);
    expect(service.snapshot().changeCount['theme']).toBe(0);
  });
});
