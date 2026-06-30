import { TestBed } from '@angular/core/testing';
import { ExperienceEventsService } from '../experience-events.service';

describe('ExperienceEventsService', () => {
  let service: ExperienceEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExperienceEventsService);
  });

  it('emits events on the bus', (done) => {
    service.events$.subscribe(e => {
      expect(e.type).toBe('theme:changed');
      expect(e.payload).toBe('dark');
      done();
    });
    service.emit('theme:changed', 'dark');
  });

  it('on() filters by type', (done) => {
    let count = 0;
    service.on('language:changed').subscribe(() => count++);
    service.emit('theme:changed', 'light');
    service.emit('language:changed', 'ar');
    setTimeout(() => { expect(count).toBe(1); done(); }, 0);
  });

  it('onAny() filters by multiple types', (done) => {
    let count = 0;
    service.onAny(['theme:changed', 'locale:changed']).subscribe(() => count++);
    service.emit('theme:changed', 'dark');
    service.emit('density:changed', 'compact');
    service.emit('locale:changed', 'fr-FR');
    setTimeout(() => { expect(count).toBe(2); done(); }, 0);
  });

  it('carries previous value in event', (done) => {
    service.events$.subscribe(e => {
      expect(e.previous).toBe('light');
      done();
    });
    service.emit('theme:changed', 'dark', 'light');
  });

  it('timestamp is an ISO string', (done) => {
    service.events$.subscribe(e => {
      expect(() => new Date(e.timestamp)).not.toThrow();
      done();
    });
    service.emit('experience:initialized', null);
  });
});
