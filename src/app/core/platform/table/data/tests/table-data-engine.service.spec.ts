import { TestBed } from '@angular/core/testing';
import { TableDataEngine } from '../table-data-engine.service';
import { TableSortContext }       from '../table-sort-context';
import { TableFilterContext }     from '../table-filter-context';
import { TablePaginationContext } from '../table-pagination-context';

type Row = Record<string, unknown>;

const ROWS: Row[] = [
  { id: 1, name: 'Charlie', score: 72, active: true  },
  { id: 2, name: 'Alice',   score: 88, active: true  },
  { id: 3, name: 'Bob',     score: 55, active: false },
  { id: 4, name: 'Diana',   score: 91, active: true  },
];

describe('TableDataEngine', () => {
  let engine: TableDataEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine = TestBed.inject(TableDataEngine);
  });

  it('should be created', () => expect(engine).toBeTruthy());

  // ─── Factories ────────────────────────────────────────────────────────────

  it('createSortContext() should return a TableSortContext', () => {
    expect(engine.createSortContext()).toBeInstanceOf(TableSortContext);
  });

  it('createFilterContext() should return a TableFilterContext', () => {
    expect(engine.createFilterContext()).toBeInstanceOf(TableFilterContext);
  });

  it('createPaginationContext() should return a TablePaginationContext', () => {
    expect(engine.createPaginationContext()).toBeInstanceOf(TablePaginationContext);
  });

  it('createSortContext() should respect initial fields', () => {
    const ctx = engine.createSortContext({
      fields: [{ columnId: 'name', field: 'name', direction: 'asc' }],
    });
    expect(ctx.isActive()).toBeTrue();
  });

  // ─── Direct operations ────────────────────────────────────────────────────

  it('sort() should sort rows by field', () => {
    const result = engine.sort(ROWS, {
      fields: [{ columnId: 'name', field: 'name', direction: 'asc' }],
      multiColumn: false, stable: true,
    });
    expect(result[0]['name']).toBe('Alice');
  });

  it('filter() should filter rows', () => {
    const result = engine.filter(ROWS, {
      root: { logic: 'and', conditions: [{ columnId: 'active', field: 'active', operator: 'boolean', value: true }] },
    });
    expect(result.every(r => r['active'] === true)).toBeTrue();
  });

  it('paginate() should slice rows', () => {
    const { rows, result } = engine.paginate(ROWS, { page: 1, pageSize: 2 });
    expect(rows.length).toBe(2);
    expect(result.totalCount).toBe(4);
  });

  // ─── run() ────────────────────────────────────────────────────────────────

  it('run() should execute the full pipeline', () => {
    const result = engine.run({
      rows: ROWS,
      filter: { root: { logic: 'and', conditions: [{ columnId: 'score', field: 'score', operator: 'greaterThan', value: 70 }] } },
      sort:   { fields: [{ columnId: 'score', field: 'score', direction: 'desc' }], multiColumn: false, stable: true },
      pagination: { page: 1, pageSize: 2 },
    });
    expect(result.rows[0]['score']).toBe(91);
    expect(result.filteredCount).toBe(3);
    expect(result.pagination).toBeDefined();
  });

  // ─── runWithContexts() ────────────────────────────────────────────────────

  it('runWithContexts() with no contexts should return all rows', () => {
    const { rows, filteredCount, totalCount } = engine.runWithContexts(ROWS);
    expect(rows.length).toBe(4);
    expect(filteredCount).toBe(4);
    expect(totalCount).toBe(4);
  });

  it('runWithContexts() should apply sort context', () => {
    const sortCtx = engine.createSortContext();
    sortCtx.addField({ columnId: 'name', field: 'name', direction: 'desc' });
    const { rows } = engine.runWithContexts(ROWS, sortCtx);
    expect(rows[0]['name']).toBe('Diana');
  });

  it('runWithContexts() should apply filter context', () => {
    const filterCtx = engine.createFilterContext();
    filterCtx.addCondition({ columnId: 'active', field: 'active', operator: 'boolean', value: false });
    const { rows } = engine.runWithContexts(ROWS, undefined, filterCtx);
    expect(rows.every(r => r['active'] === false)).toBeTrue();
  });

  it('runWithContexts() should apply pagination context', () => {
    const paginationCtx = engine.createPaginationContext({ page: 1, pageSize: 2 });
    const { rows } = engine.runWithContexts(ROWS, undefined, undefined, paginationCtx);
    expect(rows.length).toBe(2);
  });

  it('runWithContexts() should update paginationCtx.totalCount with filteredCount', () => {
    const filterCtx     = engine.createFilterContext();
    filterCtx.addCondition({ columnId: 'active', field: 'active', operator: 'boolean', value: true });
    const paginationCtx = engine.createPaginationContext({ page: 1, pageSize: 2 });
    engine.runWithContexts(ROWS, undefined, filterCtx, paginationCtx);
    expect(paginationCtx.totalCount()).toBe(3); // 3 active rows
  });

  it('runWithContexts() should skip inactive sort context', () => {
    const sortCtx = engine.createSortContext(); // no fields
    const before  = ROWS.map(r => r['name']);
    const { rows } = engine.runWithContexts(ROWS, sortCtx);
    expect(rows.map(r => r['name'])).toEqual(before);
  });

  // ─── Registry ─────────────────────────────────────────────────────────────

  it('registerComparator() should register and be usable', () => {
    engine.registerComparator('len', (a, b) => String(a).length - String(b).length);
    expect(engine.hasComparator('len')).toBeTrue();
    const result = engine.sort(ROWS, {
      fields: [{ columnId: 'name', field: 'name', direction: 'asc', comparatorId: 'len' }],
      multiColumn: false, stable: true,
    });
    // 'Bob'(3) < 'Alice'(5) < 'Diana'(5) < 'Charlie'(7)
    expect(result[0]['name']).toBe('Bob');
  });

  it('registerFilter() should register custom predicate', () => {
    engine.registerFilter('score-high', (v) => Number(v) >= 88);
    expect(engine.hasFilter('score-high')).toBeTrue();
    const result = engine.filter(ROWS, {
      root: { logic: 'and', conditions: [{
        columnId: 'score', field: 'score', operator: 'custom',
        value: null, predicateId: 'score-high',
      }] },
    });
    expect(result.every(r => (r['score'] as number) >= 88)).toBeTrue();
  });
});
