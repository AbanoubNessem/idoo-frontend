import { TestBed } from '@angular/core/testing';
import { RenderEventsService } from '../render-events.service';
import { RenderEvent } from '../rendering.types';

describe('RenderEventsService', () => {
  let service: RenderEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RenderEventsService] });
    service = TestBed.inject(RenderEventsService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should emit and receive events', () => {
    const received: RenderEvent[] = [];
    service.events$.subscribe(e => received.push(e));
    service.emit('render:started', { fieldType: 'text' });
    expect(received.length).toBe(1);
    expect(received[0].type).toBe('render:started');
  });

  it('should include timestamp and correlationId', () => {
    let event: RenderEvent | null = null;
    service.events$.subscribe(e => (event = e));
    service.emit('render:completed', {});
    expect(event!.timestamp).toBeTruthy();
    expect(event!.correlationId).toBeTruthy();
  });

  it('should use provided correlationId', () => {
    let event: RenderEvent | null = null;
    service.events$.subscribe(e => (event = e));
    service.emit('render:started', {}, 'my-id');
    expect(event!.correlationId).toBe('my-id');
  });

  it('should filter with on()', () => {
    const received: RenderEvent[] = [];
    service.on('render:completed').subscribe(e => received.push(e));
    service.emit('render:started', {});
    service.emit('render:completed', {});
    expect(received.length).toBe(1);
  });

  it('should filter multiple types with onAny()', () => {
    const received: RenderEvent[] = [];
    service.onAny('render:started', 'render:error').subscribe(e => received.push(e));
    service.emit('render:started', {});
    service.emit('render:completed', {});
    service.emit('render:error', {});
    expect(received.length).toBe(2);
  });

  it('should store events in log', () => {
    service.emit('render:started', {});
    service.emit('render:completed', {});
    expect(service.getLog().length).toBe(2);
  });

  it('should return a copy of the log', () => {
    service.emit('render:started', {});
    const log = service.getLog();
    expect(Array.isArray(log)).toBeTrue();
  });

  it('should clear the log', () => {
    service.emit('render:started', {});
    service.clearLog();
    expect(service.getLog().length).toBe(0);
  });

  it('should cap log at 500 entries', () => {
    for (let i = 0; i < 505; i++) {
      service.emit('render:started', { i });
    }
    expect(service.getLog().length).toBe(500);
  });
});
