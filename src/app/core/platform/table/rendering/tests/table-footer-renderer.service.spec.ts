import { TestBed } from '@angular/core/testing';
import { TableFooterRendererService } from '../renderers/table-footer-renderer.service';
import { ResolvedTableColumn, TableSummaryDefinition } from '../../table.types';

function col(id: string, field: string): ResolvedTableColumn {
  return { id, field, header: id, type: 'number', effectiveVisible: true, effectiveEditable: false } as ResolvedTableColumn;
}

describe('TableFooterRendererService', () => {
  let service: TableFooterRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableFooterRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── buildFooterCells ─────────────────────────────────────────────────────

  it('should return empty array when no summaries', () => {
    expect(service.buildFooterCells([], [col('amount', 'amount')])).toEqual([]);
  });

  it('should build a footer cell for a matching summary', () => {
    const summaries: TableSummaryDefinition[] = [{ field: 'amount', type: 'sum', label: 'Total' }];
    const result = service.buildFooterCells(summaries, [col('amount', 'amount')]);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('footer-cell');
    expect(result[0].field).toBe('amount');
    expect(result[0].summaryType).toBe('sum');
    expect(result[0].label).toBe('Total');
  });

  it('should skip summaries for columns not in visible list', () => {
    const summaries: TableSummaryDefinition[] = [{ field: 'hidden', type: 'sum' }];
    const result = service.buildFooterCells(summaries, [col('amount', 'amount')]);
    expect(result.length).toBe(0);
  });

  it('should produce multiple footer cells', () => {
    const summaries: TableSummaryDefinition[] = [
      { field: 'qty',    type: 'sum' },
      { field: 'amount', type: 'average', label: 'Avg' },
    ];
    const cols = [col('qty', 'qty'), col('amount', 'amount')];
    const result = service.buildFooterCells(summaries, cols);
    expect(result.length).toBe(2);
  });

  // ─── computeSummaryValue ─────────────────────────────────────────────────

  it('sum should add numeric values', () => {
    const rows = [{ amount: 10 }, { amount: 20 }, { amount: 30 }] as never;
    expect(service.computeSummaryValue('sum', 'amount', rows)).toBe(60);
  });

  it('average should compute mean', () => {
    const rows = [{ val: 10 }, { val: 20 }] as never;
    expect(service.computeSummaryValue('average', 'val', rows)).toBe(15);
  });

  it('count should return row count', () => {
    const rows = [{ val: 1 }, { val: 2 }] as never;
    expect(service.computeSummaryValue('count', 'val', rows)).toBe(2);
  });

  it('min should return minimum', () => {
    const rows = [{ n: 5 }, { n: 2 }, { n: 8 }] as never;
    expect(service.computeSummaryValue('min', 'n', rows)).toBe(2);
  });

  it('max should return maximum', () => {
    const rows = [{ n: 5 }, { n: 2 }, { n: 8 }] as never;
    expect(service.computeSummaryValue('max', 'n', rows)).toBe(8);
  });

  it('should return null for no numeric values', () => {
    expect(service.computeSummaryValue('sum', 'x', [])).toBeNull();
  });

  it('custom type should return null', () => {
    const rows = [{ n: 5 }] as never;
    expect(service.computeSummaryValue('custom', 'n', rows)).toBeNull();
  });

  it('should skip non-numeric field values', () => {
    const rows = [{ n: 'string' }, { n: null }, { n: 10 }] as never;
    expect(service.computeSummaryValue('sum', 'n', rows)).toBe(10);
  });
});
