import { TestBed } from '@angular/core/testing';
import { VisualExperienceEventsService } from './visual-experience-events.service';
import { VisualEvent }                   from './visual.types';

describe('VisualExperienceEventsService', () => {
  let service: VisualExperienceEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisualExperienceEventsService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('emits events on events$', (done) => {
    const event: VisualEvent = { type: 'density:changed', id: 'density-compact', prev: 'density-comfortable' };
    service.events$.subscribe((e) => {
      expect(e).toEqual(event);
      done();
    });
    service.emit(event);
  });

  it('on() filters by event type', (done) => {
    service.on('typography:changed').subscribe((e) => {
      expect(e.type).toBe('typography:changed');
      done();
    });
    service.emit({ type: 'density:changed',    id: 'density-compact',      prev: 'density-comfortable' });
    service.emit({ type: 'typography:changed', id: 'typography-arabic',    prev: 'typography-default'  });
  });

  it('multiple subscribers receive the same event', () => {
    const received: string[] = [];
    service.events$.subscribe((e) => received.push(`sub1:${e.type}`));
    service.events$.subscribe((e) => received.push(`sub2:${e.type}`));
    service.emit({ type: 'motion:changed', id: 'motion-reduced', prev: 'motion-normal' });
    expect(received).toContain('sub1:motion:changed');
    expect(received).toContain('sub2:motion:changed');
  });

  it('does not emit after ngOnDestroy', () => {
    const received: VisualEvent[] = [];
    service.events$.subscribe((e) => received.push(e));
    service.ngOnDestroy();
    // Should not throw, event is swallowed
    expect(() => service.emit({ type: 'density:changed', id: 'density-compact', prev: 'density-comfortable' })).not.toThrow();
    expect(received.length).toBe(0);
  });
});
