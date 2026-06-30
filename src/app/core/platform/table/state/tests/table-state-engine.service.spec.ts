import { TestBed } from '@angular/core/testing';
import { TableStateEngine } from '../table-state-engine.service';
import { TableStateStore } from '../table-state-store';
import { TableStateContext } from '../table-state-context';
import { TableStateHistory } from '../table-state-history';
import { TableStateEvent } from '../table-state.types';

describe('TableStateEngine', () => {
  let engine: TableStateEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine = TestBed.inject(TableStateEngine);
  });

  // ─── Factory ─────────────────────────────────────────────────────────────

  it('createStore() should return a TableStateStore', () => {
    expect(engine.createStore('orders')).toBeInstanceOf(TableStateStore);
  });

  it('createStore() should register the store internally', () => {
    engine.createStore('products');
    expect(engine.hasStore('products')).toBeTrue();
  });

  it('createContext() should return a TableStateContext', () => {
    const store = engine.createStore('ctx-test');
    expect(engine.createContext(store)).toBeInstanceOf(TableStateContext);
  });

  it('createHistory() should return a TableStateHistory', () => {
    expect(engine.createHistory()).toBeInstanceOf(TableStateHistory);
  });

  it('createHistory() should respect custom maxDepth', () => {
    const h = engine.createHistory(5);
    for (let i = 0; i < 7; i++) {
      h.push(engine.snapshot(engine.createStore(`tbl-${i}`)));
    }
    expect(h.depth()).toBe(5);
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  it('initialize() should emit StateInitialized', () => {
    const store  = engine.createStore('init-test');
    const events: TableStateEvent[] = [];
    engine.on('init-test', 'StateInitialized', e => events.push(e));
    engine.initialize(store);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('StateInitialized');
  });

  it('initialize() should apply initial state', () => {
    const store = engine.createStore('init2');
    engine.initialize(store, { density: 'compact' });
    expect(store.density()).toBe('compact');
  });

  it('reset() should restore defaults and emit StateReset', () => {
    const store  = engine.createStore('reset-test');
    const events: TableStateEvent[] = [];
    engine.on('reset-test', 'StateReset', e => events.push(e));
    engine.update(store, { density: 'compact' });
    engine.reset(store);
    expect(store.density()).toBe('default');
    expect(events.length).toBe(1);
  });

  it('dispose() should remove store from registry', () => {
    const store = engine.createStore('disp-test');
    engine.dispose(store);
    expect(engine.hasStore('disp-test')).toBeFalse();
  });

  it('dispose() should emit StateDisposed', () => {
    const store  = engine.createStore('disp2');
    const events: TableStateEvent[] = [];
    engine.on('disp2', 'StateDisposed', e => events.push(e));
    engine.dispose(store);
    expect(events[0].type).toBe('StateDisposed');
  });

  // ─── State Operations ─────────────────────────────────────────────────────

  it('update() should mutate store signals', () => {
    const store = engine.createStore('upd-test');
    engine.update(store, { loading: true, density: 'comfortable' });
    expect(store.loading()).toBeTrue();
    expect(store.density()).toBe('comfortable');
  });

  it('update() should emit StateChanged', () => {
    const store  = engine.createStore('upd2');
    const events: TableStateEvent[] = [];
    engine.on('upd2', 'StateChanged', e => events.push(e));
    engine.update(store, { loading: true });
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('StateChanged');
  });

  it('snapshot() should return an immutable TableStateSnapshot', () => {
    const store = engine.createStore('snap-test');
    engine.update(store, { density: 'compact' });
    const snap  = engine.snapshot(store);
    expect(snap.state.density).toBe('compact');
    expect(() => (snap as Record<string, unknown>)['tableId'] = 'x').toThrow();
  });

  it('restore() should apply snapshot back to store', () => {
    const store = engine.createStore('restore-test');
    engine.update(store, { density: 'compact', visibleColumns: ['id'] });
    const snap  = engine.snapshot(store);
    engine.update(store, { density: 'comfortable', visibleColumns: ['id', 'name'] });
    engine.restore(store, snap);
    expect(store.density()).toBe('compact');
    expect(store.visibleColumns()).toEqual(['id']);
  });

  // ─── Serialization ────────────────────────────────────────────────────────

  it('serialize/deserialize round-trip should preserve state', () => {
    const store = engine.createStore('serial-test');
    engine.update(store, { visibleColumns: ['id', 'email'] });
    const snap  = engine.snapshot(store);
    const json  = engine.serialize(snap);
    const back  = engine.deserialize(json);
    expect(back.state.visibleColumns).toEqual(['id', 'email']);
  });

  // ─── Metrics ──────────────────────────────────────────────────────────────

  it('metrics() should track updates', () => {
    const store = engine.createStore('metrics-test');
    engine.update(store, { loading: true });
    engine.update(store, { loading: false });
    expect(engine.metrics('metrics-test')!.updateCount).toBe(2);
  });

  // ─── Event System ─────────────────────────────────────────────────────────

  it('on() with wildcard tableId should catch events from any table', () => {
    const events: string[] = [];
    const off = engine.on('*', 'StateChanged', e => events.push(e.tableId));
    const s1  = engine.createStore('w1');
    const s2  = engine.createStore('w2');
    engine.update(s1, { loading: true });
    engine.update(s2, { loading: true });
    off();
    expect(events).toContain('w1');
    expect(events).toContain('w2');
  });

  it('on() with wildcard type should catch all event types', () => {
    const types: string[] = [];
    const store = engine.createStore('wt');
    engine.on('wt', '*', e => types.push(e.type));
    engine.initialize(store);
    engine.update(store, { loading: true });
    engine.reset(store);
    expect(types).toContain('StateInitialized');
    expect(types).toContain('StateChanged');
    expect(types).toContain('StateReset');
  });

  it('unsubscribe function should stop receiving events', () => {
    const store  = engine.createStore('unsub');
    const events: TableStateEvent[] = [];
    const off    = engine.on('unsub', 'StateChanged', e => events.push(e));
    engine.update(store, { loading: true });
    off();
    engine.update(store, { loading: false });
    expect(events.length).toBe(1);
  });

  // ─── Lookup ───────────────────────────────────────────────────────────────

  it('getStore() should return registered store', () => {
    const store = engine.createStore('lookup');
    expect(engine.getStore('lookup')).toBe(store);
  });

  it('getStore() should return undefined for unknown tableId', () => {
    expect(engine.getStore('nope')).toBeUndefined();
  });

  it('listStores() should include registered tableIds', () => {
    engine.createStore('list-a');
    engine.createStore('list-b');
    expect(engine.listStores()).toContain('list-a');
    expect(engine.listStores()).toContain('list-b');
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  it('validate() should return valid for well-formed update', () => {
    expect(engine.validate({ density: 'compact' }).valid).toBeTrue();
  });

  it('validate() should return invalid for bad density', () => {
    expect(engine.validate({ density: 'mega' as never }).valid).toBeFalse();
  });
});
