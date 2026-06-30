import { TestBed } from '@angular/core/testing';
import { TableRendererService } from '../table-renderer.service';
import { TableRenderContext } from '../plan/table-render-context';
import { ResolvedTableDefinition, ResolvedTableColumn } from '../../table.types';
import { TableBodyCellNode } from '../rendering.types';

function resolved(): ResolvedTableDefinition {
  const col: ResolvedTableColumn = {
    id: 'name', field: 'name', header: 'Name', type: 'text',
    effectiveVisible: true, effectiveEditable: false,
    sortable: false, filterable: false, groupable: false, searchable: false,
    hideable: true, resizable: false, exportable: true, printable: true, required: false,
    sticky: false, order: 0,
  } as ResolvedTableColumn;
  return {
    definition:     { id: 'products', name: 'Products', columns: [col] },
    columns:        [col],
    visibleColumns: [col],
    columnIndex:    new Map([['name', col]]),
    resolvedAt:     new Date().toISOString(),
    resolvedLayer:  'module',
  };
}

describe('TableRendererService (facade)', () => {
  let service: TableRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createContext should return a TableRenderContext instance', () => {
    expect(service.createContext()).toBeInstanceOf(TableRenderContext);
  });

  it('each call to createContext should return a distinct instance', () => {
    const a = service.createContext();
    const b = service.createContext();
    expect(a).not.toBe(b);
  });

  it('prepare should set context state to ready when hasData=true', () => {
    const ctx = service.createContext();
    service.prepare(resolved(), ctx, true);
    expect(ctx.asReadonly().state()).toBe('ready');
  });

  it('prepare should set context state to empty when hasData=false', () => {
    const ctx = service.createContext();
    service.prepare(resolved(), ctx, false);
    expect(ctx.asReadonly().state()).toBe('empty');
  });

  it('prepare should attach a render plan to the context', () => {
    const ctx = service.createContext();
    service.prepare(resolved(), ctx, true);
    expect(ctx.asReadonly().plan()).not.toBeNull();
  });

  it('buildPlan should return a TableRenderPlan', () => {
    const plan = service.buildPlan(resolved());
    expect(plan.tableId).toBe('products');
    expect(plan.headerCells.length).toBeGreaterThan(0);
  });

  it('applyData should transition state', () => {
    const ctx = service.createContext();
    service.prepare(resolved(), ctx, true);
    service.applyData(ctx, false);
    expect(ctx.asReadonly().state()).toBe('empty');
  });

  it('setError should put context in error state', () => {
    const ctx = service.createContext();
    service.setError(ctx, 'timeout');
    expect(ctx.asReadonly().state()).toBe('error');
    expect(ctx.asReadonly().errorMessage()).toBe('timeout');
  });

  it('setDensity should update context density', () => {
    const ctx = service.createContext();
    service.prepare(resolved(), ctx, true);
    service.setDensity(ctx, 'comfortable');
    expect(ctx.asReadonly().density()).toBe('comfortable');
  });

  it('formatValue should format a text value', () => {
    const node: TableBodyCellNode = {
      type: 'body-cell', id: 'cell-name', columnId: 'name', field: 'name',
      columnType: 'text', editable: false, visible: true, order: 0,
    };
    const cv = service.formatValue('Widget', node);
    expect(cv.formatted).toBe('Widget');
    expect(cv.isEmpty).toBeFalse();
  });

  it('formatValue should handle null as empty', () => {
    const node: TableBodyCellNode = {
      type: 'body-cell', id: 'cell-name', columnId: 'name', field: 'name',
      columnType: 'text', editable: false, visible: true, order: 0,
    };
    const cv = service.formatValue(null, node);
    expect(cv.isEmpty).toBeTrue();
  });

  it('header sub-service should be accessible', () => {
    expect(service.header).toBeTruthy();
  });

  it('cell sub-service should be accessible', () => {
    expect(service.cell).toBeTruthy();
  });

  it('footer sub-service should be accessible', () => {
    expect(service.footer).toBeTruthy();
  });

  it('toolbar sub-service should be accessible', () => {
    expect(service.toolbar).toBeTruthy();
  });

  it('empty sub-service should be accessible', () => {
    expect(service.empty).toBeTruthy();
  });

  it('loading sub-service should be accessible', () => {
    expect(service.loading).toBeTruthy();
  });

  it('error sub-service should be accessible', () => {
    expect(service.error).toBeTruthy();
  });
});
