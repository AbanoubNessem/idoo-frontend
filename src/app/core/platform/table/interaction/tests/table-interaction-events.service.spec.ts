import { TestBed } from '@angular/core/testing';
import { TableInteractionEvents } from '../table-interaction-events.service';
import { TableInteractionEvent } from '../table-interaction.types';

describe('TableInteractionEvents', () => {
  let events: TableInteractionEvents;

  const makeEvent = (
    type: TableInteractionEvent['type'],
    tableId = 't1',
  ): TableInteractionEvent => ({
    type,
    tableId,
    timestamp: new Date().toISOString(),
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    events = TestBed.inject(TableInteractionEvents);
  });

  it('starts with 0 handlers', () => {
    expect(events.handlerCount()).toBe(0);
  });

  describe('on() / emit()', () => {
    it('fires a registered handler on matching event', () => {
      const spy = jasmine.createSpy('handler');
      events.on('t1', 'SelectionChanged', spy);
      events.emit(makeEvent('SelectionChanged', 't1'));
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does not fire for different table', () => {
      const spy = jasmine.createSpy('handler');
      events.on('t1', 'SelectionChanged', spy);
      events.emit(makeEvent('SelectionChanged', 't2'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not fire for different event type', () => {
      const spy = jasmine.createSpy('handler');
      events.on('t1', 'EditStarted', spy);
      events.emit(makeEvent('SelectionChanged', 't1'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('wildcard tableId catches all tables', () => {
      const spy = jasmine.createSpy('handler');
      events.on('*', 'SelectionChanged', spy);
      events.emit(makeEvent('SelectionChanged', 't1'));
      events.emit(makeEvent('SelectionChanged', 't2'));
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('wildcard event type catches all events for table', () => {
      const spy = jasmine.createSpy('handler');
      events.on('t1', '*', spy);
      events.emit(makeEvent('SelectionChanged', 't1'));
      events.emit(makeEvent('EditStarted', 't1'));
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('double wildcard catches all events all tables', () => {
      const spy = jasmine.createSpy('handler');
      events.on('*', '*', spy);
      events.emit(makeEvent('SelectionChanged', 't1'));
      events.emit(makeEvent('EditCommitted', 't2'));
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('updates handlerCount reactively', () => {
      expect(events.handlerCount()).toBe(0);
      events.on('t1', 'SelectionChanged', () => {});
      expect(events.handlerCount()).toBe(1);
    });
  });

  describe('unsubscribe', () => {
    it('returned fn removes the handler', () => {
      const spy  = jasmine.createSpy('handler');
      const unsub = events.on('t1', 'SelectionChanged', spy);
      unsub();
      events.emit(makeEvent('SelectionChanged', 't1'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('decrements handlerCount', () => {
      const unsub = events.on('t1', 'SelectionChanged', () => {});
      expect(events.handlerCount()).toBe(1);
      unsub();
      expect(events.handlerCount()).toBe(0);
    });
  });

  describe('off()', () => {
    it('removes all handlers for a table+type', () => {
      const spy = jasmine.createSpy();
      events.on('t1', 'SelectionChanged', spy);
      events.off('t1', 'SelectionChanged');
      events.emit(makeEvent('SelectionChanged', 't1'));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('clear()', () => {
    it('removes all handlers for a tableId', () => {
      const spy1 = jasmine.createSpy();
      const spy2 = jasmine.createSpy();
      events.on('t1', 'SelectionChanged', spy1);
      events.on('t1', 'EditStarted', spy2);
      events.clear('t1');
      events.emit(makeEvent('SelectionChanged', 't1'));
      events.emit(makeEvent('EditStarted', 't1'));
      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
    });
  });

  describe('event payload', () => {
    it('handler receives the full event object', () => {
      let received: TableInteractionEvent | undefined;
      events.on('t1', '*', e => { received = e; });
      const ev = { ...makeEvent('RowSelected'), payload: { id: 'r1' } };
      events.emit(ev);
      expect(received).toBeDefined();
      expect(received!.payload).toEqual({ id: 'r1' });
    });
  });
});
