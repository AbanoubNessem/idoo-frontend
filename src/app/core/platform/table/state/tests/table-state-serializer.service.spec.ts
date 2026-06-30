import { TestBed } from '@angular/core/testing';
import { TableStateSerializerService } from '../table-state-serializer.service';
import { TableState } from '../table-state.types';

function state(overrides: Partial<TableState> = {}): TableState {
  return {
    tableId:        'invoices',
    loading:        false,
    error:          null,
    density:        'default',
    visibleColumns: ['id', 'amount'],
    expandedRows:   [],
    focusedCell:    null,
    hoveredRow:     null,
    activeRow:      null,
    selection:      { active: false, mode: 'none' },
    sort:           { active: false },
    filter:         { active: false },
    pagination:     { active: false },
    editing:        { active: false },
    ...overrides,
  };
}

describe('TableStateSerializerService', () => {
  let service: TableStateSerializerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableStateSerializerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createSnapshot() should produce a unique id per call', () => {
    const s1 = service.createSnapshot('t', state());
    const s2 = service.createSnapshot('t', state());
    expect(s1.id).not.toBe(s2.id);
  });

  it('createSnapshot() should include an ISO capturedAt', () => {
    const snap = service.createSnapshot('t', state());
    expect(() => new Date(snap.capturedAt)).not.toThrow();
  });

  it('createSnapshot() should set tableId on snapshot', () => {
    expect(service.createSnapshot('invoices', state()).tableId).toBe('invoices');
  });

  it('createSnapshot() should freeze the snapshot', () => {
    const snap = service.createSnapshot('t', state());
    expect(() => (snap as Record<string, unknown>)['tableId'] = 'other').toThrow();
  });

  it('createSnapshot() should freeze the inner state', () => {
    const snap = service.createSnapshot('t', state());
    expect(() => (snap.state as Record<string, unknown>)['loading'] = true).toThrow();
  });

  it('serialize() should produce valid JSON', () => {
    const snap = service.createSnapshot('t', state());
    expect(() => JSON.parse(service.serialize(snap))).not.toThrow();
  });

  it('serialize() round-trip should preserve tableId', () => {
    const snap  = service.createSnapshot('t', state());
    const json  = service.serialize(snap);
    const back  = service.deserialize(json);
    expect(back.tableId).toBe('invoices');
  });

  it('serialize() round-trip should preserve visibleColumns', () => {
    const snap = service.createSnapshot('t', state({ visibleColumns: ['id', 'amount', 'date'] }));
    const back = service.deserialize(service.serialize(snap));
    expect(back.state.visibleColumns).toEqual(['id', 'amount', 'date']);
  });

  it('deserialize() should throw on malformed JSON', () => {
    expect(() => service.deserialize('not json')).toThrowError();
  });

  it('deserialize() should throw when tableId is missing', () => {
    expect(() => service.deserialize(JSON.stringify({ state: {} }))).toThrowError();
  });

  it('toObject() should return a plain object', () => {
    const snap = service.createSnapshot('t', state());
    const obj  = service.toObject(snap);
    expect(obj['tableId']).toBe('invoices');
  });

  it('fromObject() should build a frozen snapshot', () => {
    const snap = service.createSnapshot('t', state());
    const obj  = service.toObject(snap);
    const back = service.fromObject(obj);
    expect(back.tableId).toBe('invoices');
    expect(() => (back as Record<string, unknown>)['tableId'] = 'x').toThrow();
  });

  it('fromObject() should apply defaults for missing state fields', () => {
    const snap = service.fromObject({ tableId: 'tbl', state: {} });
    expect(snap.state.loading).toBeFalse();
    expect(snap.state.density).toBe('default');
  });

  it('clone() should produce a deep copy with a new id', () => {
    const snap  = service.createSnapshot('t', state());
    const clone = service.clone(snap);
    expect(clone).not.toBe(snap);
    expect(clone.tableId).toBe(snap.tableId);
  });
});
