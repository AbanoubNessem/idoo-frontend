import { TestBed } from '@angular/core/testing';
import { TableHeaderRendererService } from '../renderers/table-header-renderer.service';
import { ResolvedTableColumn } from '../../table.types';

function col(overrides: Partial<ResolvedTableColumn> = {}): ResolvedTableColumn {
  return {
    id: 'name', field: 'name', header: 'Name', type: 'text',
    effectiveVisible: true, effectiveEditable: false,
    ...overrides,
  } as ResolvedTableColumn;
}

describe('TableHeaderRendererService', () => {
  let service: TableHeaderRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableHeaderRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should produce a header cell for each visible column', () => {
    const result = service.buildHeaderCells([col(), col({ id: 'age', field: 'age', header: 'Age', type: 'number' })]);
    expect(result.length).toBe(2);
  });

  it('should set type to header-cell', () => {
    const result = service.buildHeaderCells([col()]);
    expect(result[0].type).toBe('header-cell');
  });

  it('should map id, field, header correctly', () => {
    const result = service.buildHeaderCells([col()]);
    expect(result[0].columnId).toBe('name');
    expect(result[0].field).toBe('name');
    expect(result[0].header).toBe('Name');
  });

  it('should prefix id with hdr-', () => {
    expect(service.buildHeaderCells([col()])[0].id).toBe('hdr-name');
  });

  it('should set visible: true', () => {
    expect(service.buildHeaderCells([col()])[0].visible).toBeTrue();
  });

  it('should default sortable to false', () => {
    expect(service.buildHeaderCells([col()])[0].sortable).toBeFalse();
  });

  it('should propagate sortable: true', () => {
    expect(service.buildHeaderCells([col({ sortable: true })])[0].sortable).toBeTrue();
  });

  it('should default filterable to false', () => {
    expect(service.buildHeaderCells([col()])[0].filterable).toBeFalse();
  });

  it('should default hideable to true', () => {
    expect(service.buildHeaderCells([col()])[0].hideable).toBeTrue();
  });

  it('should propagate sticky', () => {
    const result = service.buildHeaderCells([col({ sticky: 'start' })]);
    expect(result[0].sticky).toBe('start');
  });

  it('should propagate width, minWidth, maxWidth', () => {
    const result = service.buildHeaderCells([col({ width: 100, minWidth: 60, maxWidth: 200 })]);
    expect(result[0].width).toBe(100);
    expect(result[0].minWidth).toBe(60);
    expect(result[0].maxWidth).toBe(200);
  });

  it('should sort by order when order is set', () => {
    const cols = [
      col({ id: 'b', field: 'b', header: 'B', order: 2 }),
      col({ id: 'a', field: 'a', header: 'A', order: 1 }),
    ];
    const result = service.buildHeaderCells(cols);
    expect(result[0].columnId).toBe('a');
    expect(result[1].columnId).toBe('b');
  });

  it('should return empty array for empty columns', () => {
    expect(service.buildHeaderCells([])).toEqual([]);
  });
});
