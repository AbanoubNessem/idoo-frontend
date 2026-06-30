import { TestBed } from '@angular/core/testing';
import { VisualExperienceMetricsService } from './visual-experience-metrics.service';

describe('VisualExperienceMetricsService', () => {
  let service: VisualExperienceMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisualExperienceMetricsService);
  });

  it('starts with zero counts', () => {
    const snap = service.snapshot();
    expect(snap.applyCount).toBe(0);
    expect(snap.errorCount).toBe(0);
    expect(snap.lastApplyMs).toBe(0);
  });

  it('increments applyCount', () => {
    service.recordApply(12);
    expect(service.snapshot().applyCount).toBe(1);
    expect(service.snapshot().lastApplyMs).toBe(12);
  });

  it('increments change count per dimension', () => {
    service.recordChange('typography');
    service.recordChange('typography');
    service.recordChange('density');
    const snap = service.snapshot();
    expect(snap.changeByDimension.typography).toBe(2);
    expect(snap.changeByDimension.density).toBe(1);
    expect(snap.changeByDimension['icon-pack']).toBe(0);
  });

  it('increments errorCount', () => {
    service.recordError();
    service.recordError();
    expect(service.snapshot().errorCount).toBe(2);
  });

  it('reset clears all counts', () => {
    service.recordApply(5);
    service.recordChange('motion');
    service.recordError();
    service.reset();
    const snap = service.snapshot();
    expect(snap.applyCount).toBe(0);
    expect(snap.errorCount).toBe(0);
    expect(snap.changeByDimension.motion).toBe(0);
  });

  it('snapshot has initializedAt as ISO string', () => {
    const snap = service.snapshot();
    expect(() => new Date(snap.initializedAt)).not.toThrow();
    expect(snap.initializedAt).toBeTruthy();
  });
});
