import { TestBed } from '@angular/core/testing';
import { TableCellRendererService } from '../renderers/table-cell-renderer.service';
import { ResolvedTableColumn } from '../../table.types';
import { TableBodyCellNode } from '../rendering.types';

function col(type = 'text', overrides: Partial<ResolvedTableColumn> = {}): ResolvedTableColumn {
  return {
    id: 'f', field: 'f', header: 'F', type: type as never,
    effectiveVisible: true, effectiveEditable: false, ...overrides,
  } as ResolvedTableColumn;
}

function node(type = 'text'): TableBodyCellNode {
  return {
    type: 'body-cell', id: 'cell-col-f', visible: true,
    columnId: 'f', field: 'f', columnType: type as never, editable: false, order: 0,
  };
}

describe('TableCellRendererService', () => {
  let service: TableCellRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableCellRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── buildBodyCells ───────────────────────────────────────────────────────

  it('should produce one body cell per column', () => {
    expect(service.buildBodyCells([col(), col('number')]).length).toBe(2);
  });

  it('should set type to body-cell', () => {
    expect(service.buildBodyCells([col()])[0].type).toBe('body-cell');
  });

  it('should map columnId and field', () => {
    const result = service.buildBodyCells([col()]);
    expect(result[0].columnId).toBe('f');
    expect(result[0].field).toBe('f');
  });

  it('should sort by order', () => {
    const cols = [col('text', { id: 'b', field: 'b', header: 'B', order: 2 }), col('text', { id: 'a', field: 'a', header: 'A', order: 1 })];
    const result = service.buildBodyCells(cols);
    expect(result[0].columnId).toBe('a');
  });

  // ─── formatValue ──────────────────────────────────────────────────────────

  it('should return isEmpty:true for null', () => {
    const cv = service.formatValue(null, node());
    expect(cv.isEmpty).toBeTrue();
    expect(cv.formatted).toBe('');
  });

  it('should return isEmpty:true for undefined', () => {
    expect(service.formatValue(undefined, node()).isEmpty).toBeTrue();
  });

  it('should return isEmpty:true for empty string', () => {
    expect(service.formatValue('', node()).isEmpty).toBeTrue();
  });

  it('should format text as string', () => {
    expect(service.formatValue('hello', node('text')).formatted).toBe('hello');
  });

  it('should format number', () => {
    const cv = service.formatValue(1000, node('number'), 'en-US');
    expect(cv.formatted).toBe('1,000');
  });

  it('should format boolean as Yes/No', () => {
    expect(service.formatValue(true,  node('boolean')).formatted).toBe('Yes');
    expect(service.formatValue(false, node('boolean')).formatted).toBe('No');
  });

  it('should format progress with % suffix', () => {
    expect(service.formatValue(75, node('progress')).formatted).toBe('75%');
  });

  it('should format date as string', () => {
    const cv = service.formatValue('2024-01-15', node('date'), 'en-US');
    expect(cv.formatted).toBeTruthy();
    expect(typeof cv.formatted).toBe('string');
  });

  it('should format percentage', () => {
    const cv = service.formatValue(0.25, node('percentage'), 'en-US');
    expect(cv.formatted).toContain('%');
  });

  it('should format email as plain string', () => {
    expect(service.formatValue('user@x.com', node('email')).formatted).toBe('user@x.com');
  });

  it('should format phone as plain string', () => {
    expect(service.formatValue('+1-555-0100', node('phone')).formatted).toBe('+1-555-0100');
  });

  it('should format custom as string', () => {
    expect(service.formatValue('custom-val', node('custom')).formatted).toBe('custom-val');
  });

  it('should recover gracefully from an invalid date', () => {
    const cv = service.formatValue('NOT_A_DATE', node('date'));
    expect(typeof cv.formatted).toBe('string');
  });

  // ─── resolveCellClasses ───────────────────────────────────────────────────

  it('should return [] when no cellClass', () => {
    expect(service.resolveCellClasses(node(), 'v', {})).toEqual([]);
  });

  it('should return classes from string cellClass', () => {
    const n = { ...node(), cellClass: 'my-class' } as TableBodyCellNode;
    expect(service.resolveCellClasses(n, 'v', {})).toEqual(['my-class']);
  });

  it('should return classes from array cellClass', () => {
    const n = { ...node(), cellClass: ['a', 'b'] } as TableBodyCellNode;
    expect(service.resolveCellClasses(n, 'v', {})).toEqual(['a', 'b']);
  });

  it('should call function cellClass and return result', () => {
    const fn = (v: unknown) => v === 'x' ? 'active' : 'inactive';
    const n = { ...node(), cellClass: fn } as TableBodyCellNode;
    expect(service.resolveCellClasses(n, 'x', {})).toEqual(['active']);
  });
});
