import { TestBed } from '@angular/core/testing';
import { TableFilteringEngine } from '../table-filtering-engine.service';
import { TableFilterConfig, TableFilterCondition } from '../table-data.types';

type Row = Record<string, unknown>;

function config(conditions: TableFilterCondition[], logic: 'and' | 'or' = 'and'): TableFilterConfig {
  return { root: { logic, conditions } };
}

function cond(field: string, operator: TableFilterCondition['operator'], value: unknown, opts?: Partial<TableFilterCondition>): TableFilterCondition {
  return { columnId: field, field, operator, value, ...opts };
}

const ROWS: Row[] = [
  { name: 'Alice',   age: 30, active: true,  score: 88,  joined: '2020-03-15' },
  { name: 'Bob',     age: 25, active: false, score: 55,  joined: '2021-06-20' },
  { name: 'Charlie', age: 35, active: true,  score: 72,  joined: '2019-11-05' },
  { name: 'Diana',   age: 28, active: true,  score: 91,  joined: '2022-01-10' },
];

describe('TableFilteringEngine', () => {
  let service: TableFilteringEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableFilteringEngine);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('should return copy of rows when no conditions', () => {
    const result = service.filter(ROWS, { root: { logic: 'and', conditions: [] } });
    expect(result).not.toBe(ROWS);
    expect(result.length).toBe(ROWS.length);
  });

  it('should not mutate original array', () => {
    const rows  = [...ROWS];
    const before = rows.length;
    service.filter(rows, config([cond('name', 'contains', 'a')]));
    expect(rows.length).toBe(before);
  });

  // ─── contains ─────────────────────────────────────────────────────────────

  it('contains should match substring', () => {
    const r = service.filter(ROWS, config([cond('name', 'contains', 'li')]));
    expect(r.map(x => x['name'])).toContain('Alice');
    expect(r.map(x => x['name'])).toContain('Charlie');
  });

  it('contains should be case-insensitive by default', () => {
    const r = service.filter(ROWS, config([cond('name', 'contains', 'ALICE')]));
    expect(r.length).toBe(1);
  });

  it('contains with caseSensitive=true should be exact', () => {
    const r = service.filter(ROWS, config([cond('name', 'contains', 'ALICE', { caseSensitive: true })]));
    expect(r.length).toBe(0);
  });

  // ─── startsWith ───────────────────────────────────────────────────────────

  it('startsWith should match prefix', () => {
    const r = service.filter(ROWS, config([cond('name', 'startsWith', 'D')]));
    expect(r.map(x => x['name'])).toEqual(['Diana']);
  });

  // ─── endsWith ─────────────────────────────────────────────────────────────

  it('endsWith should match suffix', () => {
    const r = service.filter(ROWS, config([cond('name', 'endsWith', 'e')]));
    expect(r.map(x => x['name'])).toContain('Alice');
    expect(r.map(x => x['name'])).toContain('Charlie');
  });

  // ─── equals / notEquals ───────────────────────────────────────────────────

  it('equals should match exact value', () => {
    const r = service.filter(ROWS, config([cond('name', 'equals', 'Bob')]));
    expect(r.length).toBe(1);
    expect(r[0]['name']).toBe('Bob');
  });

  it('notEquals should exclude exact match', () => {
    const r = service.filter(ROWS, config([cond('name', 'notEquals', 'Bob')]));
    expect(r.every(x => x['name'] !== 'Bob')).toBeTrue();
  });

  // ─── greaterThan / lessThan ───────────────────────────────────────────────

  it('greaterThan should filter numerically', () => {
    const r = service.filter(ROWS, config([cond('age', 'greaterThan', 29)]));
    expect(r.every(x => (x['age'] as number) > 29)).toBeTrue();
  });

  it('lessThan should filter numerically', () => {
    const r = service.filter(ROWS, config([cond('age', 'lessThan', 30)]));
    expect(r.every(x => (x['age'] as number) < 30)).toBeTrue();
  });

  // ─── between ──────────────────────────────────────────────────────────────

  it('between should include range boundaries', () => {
    const r = service.filter(ROWS, config([cond('age', 'between', 25, { value2: 30 })]));
    expect(r.every(x => (x['age'] as number) >= 25 && (x['age'] as number) <= 30)).toBeTrue();
  });

  // ─── in ───────────────────────────────────────────────────────────────────

  it('in should match any value in list', () => {
    const r = service.filter(ROWS, config([cond('name', 'in', ['Alice', 'Diana'])]));
    expect(r.map(x => x['name'])).toEqual(['Alice', 'Diana']);
  });

  it('in should return empty when list is empty', () => {
    expect(service.filter(ROWS, config([cond('name', 'in', [])])).length).toBe(0);
  });

  // ─── boolean ──────────────────────────────────────────────────────────────

  it('boolean should filter true values', () => {
    const r = service.filter(ROWS, config([cond('active', 'boolean', true)]));
    expect(r.every(x => x['active'] === true)).toBeTrue();
  });

  // ─── date ─────────────────────────────────────────────────────────────────

  it('date should match same calendar day', () => {
    const r = service.filter(ROWS, config([cond('joined', 'date', '2021-06-20')]));
    expect(r.length).toBe(1);
    expect(r[0]['name']).toBe('Bob');
  });

  // ─── compound AND / OR ────────────────────────────────────────────────────

  it('AND logic should require all conditions', () => {
    const r = service.filter(ROWS, config([
      cond('active', 'boolean', true),
      cond('age',    'greaterThan', 29),
    ], 'and'));
    expect(r.every(x => x['active'] === true && (x['age'] as number) > 29)).toBeTrue();
  });

  it('OR logic should require at least one condition', () => {
    const r = service.filter(ROWS, config([
      cond('name', 'equals', 'Alice'),
      cond('name', 'equals', 'Bob'),
    ], 'or'));
    expect(r.map(x => x['name'])).toContain('Alice');
    expect(r.map(x => x['name'])).toContain('Bob');
  });

  it('nested group should evaluate correctly', () => {
    const filterCfg: TableFilterConfig = {
      root: {
        logic: 'and',
        conditions: [cond('active', 'boolean', true)],
        groups: [{
          logic: 'or',
          conditions: [cond('score', 'greaterThan', 85), cond('name', 'equals', 'Charlie')],
        }],
      },
    };
    const r = service.filter(ROWS, filterCfg);
    expect(r.every(x => x['active'] === true)).toBeTrue();
    expect(r.some(x => x['name'] === 'Charlie' || (x['score'] as number) > 85)).toBeTrue();
  });

  // ─── dot-notation ─────────────────────────────────────────────────────────

  it('should support dot-notation field paths', () => {
    const rows: Row[] = [
      { address: { city: 'Athens' } },
      { address: { city: 'Berlin' } },
    ];
    const r = service.filter(rows, {
      root: { logic: 'and', conditions: [{ columnId: 'city', field: 'address.city', operator: 'equals', value: 'Athens' }] },
    });
    expect(r.length).toBe(1);
  });
});
