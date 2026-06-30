import { TestBed } from '@angular/core/testing';
import { TableRenderPlanBuilderService } from '../plan/table-render-plan-builder.service';
import { ResolvedTableDefinition, ResolvedTableColumn, TableDefinition } from '../../table.types';

function resolvedDef(overrides: Partial<TableDefinition> = {}): ResolvedTableDefinition {
  const col = (id: string): ResolvedTableColumn => ({
    id, field: id, header: id.toUpperCase(), type: 'text',
    effectiveVisible: true, effectiveEditable: false,
    sortable: false, filterable: false, groupable: false, searchable: false,
    hideable: true, resizable: false, exportable: true, printable: true, required: false,
    sticky: false, order: 0,
  } as ResolvedTableColumn);

  const columns = [col('id'), col('name')];

  const def: TableDefinition = {
    id: 'orders', name: 'Orders',
    columns: columns.map(c => c),
    ...overrides,
  };

  return {
    definition:     def,
    columns,
    visibleColumns: columns,
    columnIndex:    new Map(columns.map(c => [c.id, c])),
    resolvedAt:     new Date().toISOString(),
    resolvedLayer:  'module',
  };
}

describe('TableRenderPlanBuilderService', () => {
  let service: TableRenderPlanBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableRenderPlanBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build a plan with a unique incremental id', () => {
    const p1 = service.build(resolvedDef());
    const p2 = service.build(resolvedDef());
    expect(p1.id).not.toBe(p2.id);
  });

  it('should set tableId from definition', () => {
    expect(service.build(resolvedDef()).tableId).toBe('orders');
  });

  it('should include a plannedAt ISO timestamp', () => {
    const plan = service.build(resolvedDef());
    expect(() => new Date(plan.plannedAt)).not.toThrow();
  });

  it('should default state to ready', () => {
    expect(service.build(resolvedDef()).state).toBe('ready');
  });

  it('should accept explicit state', () => {
    expect(service.build(resolvedDef(), 'loading').state).toBe('loading');
  });

  it('should override state to error when errorMsg is provided', () => {
    expect(service.build(resolvedDef(), 'ready', 'oops').state).toBe('error');
  });

  it('should set density from definition', () => {
    const plan = service.build(resolvedDef({ density: 'compact' }));
    expect(plan.density).toBe('compact');
  });

  it('should default density to "default"', () => {
    expect(service.build(resolvedDef()).density).toBe('default');
  });

  it('should populate headerCells', () => {
    expect(service.build(resolvedDef()).headerCells.length).toBe(2);
  });

  it('should populate bodyCells', () => {
    expect(service.build(resolvedDef()).bodyCells.length).toBe(2);
  });

  it('should set columnCount', () => {
    expect(service.build(resolvedDef()).columnCount).toBe(2);
  });

  it('should set hasFooter: false when no summaries', () => {
    expect(service.build(resolvedDef()).hasFooter).toBeFalse();
  });

  it('should set hasFooter: true when summaries exist', () => {
    const plan = service.build(resolvedDef({ summaries: [{ field: 'id', type: 'count' }] }));
    expect(plan.hasFooter).toBeTrue();
  });

  it('should set hasToolbar: false when no toolbar/actions', () => {
    expect(service.build(resolvedDef()).hasToolbar).toBeFalse();
  });

  it('should set hasToolbar: true when toolbar is defined', () => {
    const plan = service.build(resolvedDef({ toolbar: { search: true } }));
    expect(plan.hasToolbar).toBeTrue();
  });

  it('should include loading, empty, error nodes', () => {
    const plan = service.build(resolvedDef());
    expect(plan.loading.type).toBe('loading');
    expect(plan.empty.type).toBe('empty');
    expect(plan.error.type).toBe('error');
  });
});
