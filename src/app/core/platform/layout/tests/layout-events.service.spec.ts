import { TestBed } from '@angular/core/testing';
import { LayoutEventsService } from '../layout-events.service';
import { LayoutEvent } from '../layout.types';

describe('LayoutEventsService', () => {
  let service: LayoutEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutEventsService);
  });

  it('emits events on the bus', (done) => {
    service.events$.subscribe(event => {
      expect(event.type).toBe('layout:created');
      done();
    });
    service.emitFor('lay-1', 'layout:created', null);
  });

  it('on() filters by event type', (done) => {
    let count = 0;
    service.on('layout:updated').subscribe(() => count++);
    service.emitFor('id', 'layout:created', null);
    service.emitFor('id', 'layout:updated', null);
    setTimeout(() => {
      expect(count).toBe(1);
      done();
    }, 0);
  });

  it('forLayout() filters by layoutId', (done) => {
    let count = 0;
    service.forLayout('target').subscribe(() => count++);
    service.emitFor('other', 'layout:created', null);
    service.emitFor('target', 'layout:created', null);
    setTimeout(() => {
      expect(count).toBe(1);
      done();
    }, 0);
  });

  it('emit() accepts a full LayoutEvent', (done) => {
    const ev: LayoutEvent = {
      type: 'breakpoint:changed',
      layoutId: 'global',
      timestamp: new Date().toISOString(),
      payload: { breakpoint: 'lg' },
    };
    service.events$.subscribe(e => {
      expect(e.payload).toEqual({ breakpoint: 'lg' });
      done();
    });
    service.emit(ev);
  });
});
