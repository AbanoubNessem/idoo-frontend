import { TestBed } from '@angular/core/testing';
import { TableDataPipeline } from '../table-data-pipeline.service';
import { TableDataPipelineInput, TableSortConfig, TableFilterConfig, TablePaginationConfig } from '../table-data.types';

type Row = Record<string, unknown>;

const ROWS: Row[] = [
  { id: 1, name: 'Charlie', score: 72 },
  { id: 2, name: 'Alice',   score: 88 },
  { id: 3, name: 'Bob',     score: 55 },
  { id: 4, name: 'Diana',   score: 91 },
  { id: 5, name: 'Eve',     score: 67 },
];

const SORT_BY_NAME_ASC: TableSortConfig = {
  fields: [{ columnId: 'name', field: 'name', direction: 'asc' }],
  multiColumn: false, stable: true,
};

const FILTER_SCORE_GT_70: TableFilterConfig = {
  root: {
    logic: 'and',
    conditions: [{ columnId: 'score', field: 'score', operator: 'greaterThan', value: 70 }],
  },
};

const PAGE_1_OF_3: TablePaginationConfig = { page: 1, pageSize: 2 };

describe('TableDataPipeline', () => {
  let pipeline: TableDataPipeline;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    pipeline = TestBed.inject(TableDataPipeline);
  });

  it('should be created', () => expect(pipeline).toBeTruthy());

  it('should not mutate original rows', () => {
    const input: TableDataPipelineInput = { rows: [...ROWS], sort: SORT_BY_NAME_ASC };
    const before = ROWS.map(r => r['name']);
    pipeline.run(input);
    expect(ROWS.map(r => r['name'])).toEqual(before);
  });

  it('should return all rows when no ops applied', () => {
    const { rows, totalCount, filteredCount } = pipeline.run({ rows: ROWS });
    expect(rows.length).toBe(5);
    expect(totalCount).toBe(5);
    expect(filteredCount).toBe(5);
  });

  // ─── Filter step ──────────────────────────────────────────────────────────

  it('should apply filter', () => {
    const { rows, filteredCount } = pipeline.run({ rows: ROWS, filter: FILTER_SCORE_GT_70 });
    expect(rows.every(r => (r['score'] as number) > 70)).toBeTrue();
    expect(filteredCount).toBe(rows.length);
  });

  it('filteredCount should reflect count after filter (not total)', () => {
    const { filteredCount, totalCount } = pipeline.run({ rows: ROWS, filter: FILTER_SCORE_GT_70 });
    expect(filteredCount).toBeLessThan(totalCount);
    expect(totalCount).toBe(5);
  });

  // ─── Sort step ────────────────────────────────────────────────────────────

  it('should apply sort', () => {
    const { rows } = pipeline.run({ rows: ROWS, sort: SORT_BY_NAME_ASC });
    expect(rows[0]['name']).toBe('Alice');
    expect(rows[rows.length - 1]['name']).toBe('Eve');
  });

  // ─── Pagination step ──────────────────────────────────────────────────────

  it('should apply pagination', () => {
    const { rows, pagination } = pipeline.run({ rows: ROWS, pagination: PAGE_1_OF_3 });
    expect(rows.length).toBe(2);
    expect(pagination).toBeDefined();
    expect(pagination!.totalCount).toBe(5);
  });

  it('pagination totalCount should be filteredCount', () => {
    const { rows: _, pagination } = pipeline.run({
      rows: ROWS, filter: FILTER_SCORE_GT_70, pagination: PAGE_1_OF_3,
    });
    expect(pagination!.totalCount).toBe(3);
  });

  // ─── Pipeline order: filter → sort → paginate ────────────────────────────

  it('should filter then sort then paginate', () => {
    const { rows, filteredCount, pagination } = pipeline.run({
      rows:       ROWS,
      filter:     FILTER_SCORE_GT_70,
      sort:       SORT_BY_NAME_ASC,
      pagination: PAGE_1_OF_3,
    });
    // filtered: Alice(88), Charlie(72), Diana(91) → sorted: Alice, Charlie, Diana → page1: Alice, Charlie
    expect(rows[0]['name']).toBe('Alice');
    expect(rows[1]['name']).toBe('Charlie');
    expect(filteredCount).toBe(3);
    expect(pagination!.pageCount).toBe(2);
  });

  it('result should be frozen', () => {
    const result = pipeline.run({ rows: ROWS });
    expect(() => (result as Record<string, unknown>)['totalCount'] = 99).toThrow();
  });

  it('should handle empty rows', () => {
    const { rows, filteredCount, totalCount } = pipeline.run({ rows: [], filter: FILTER_SCORE_GT_70 });
    expect(rows.length).toBe(0);
    expect(filteredCount).toBe(0);
    expect(totalCount).toBe(0);
  });
});
