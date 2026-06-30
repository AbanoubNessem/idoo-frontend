import { TestBed } from '@angular/core/testing';
import { TableRenderEngineService } from '../engine/table-render-engine.service';
import { TableRenderContext } from '../plan/table-render-context';
import { ResolvedTableDefinition, ResolvedTableColumn } from '../../table.types';

function ctx(): TableRenderContext {
  return new TableRenderContext();
}

function resolved(): ResolvedTableDefinition {
  const col: ResolvedTableColumn = {
    id: 'id', field: 'id', header: 'ID', type: 'text',
    effectiveVisible: true, effectiveEditable: false,
    sortable: false, filterable: false, groupable: false, searchable: false,
    hideable: true, resizable: false, exportable: true, printable: true, required: false,
    sticky: false, order: 0,
  } as ResolvedTableColumn;
  return {
    definition:     { id: 'tbl', name: 'Tbl', columns: [col] },
    columns:        [col],
    visibleColumns: [col],
    columnIndex:    new Map([['id', col]]),
    resolvedAt:     new Date().toISOString(),
    resolvedLayer:  'runtime',
  };
}

describe('TableRenderEngineService', () => {
  let service: TableRenderEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableRenderEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('prepareFromResolved should set context to ready when hasData=true', () => {
    const c = ctx();
    service.prepareFromResolved(resolved(), c, true);
    expect(c.asReadonly().state()).toBe('ready');
  });

  it('prepareFromResolved should set context to empty when hasData=false', () => {
    const c = ctx();
    service.prepareFromResolved(resolved(), c, false);
    expect(c.asReadonly().state()).toBe('empty');
  });

  it('prepareFromResolved should set a render plan', () => {
    const c = ctx();
    service.prepareFromResolved(resolved(), c, true);
    expect(c.asReadonly().plan()).not.toBeNull();
  });

  it('applyData transitions ready→empty', () => {
    const c = ctx();
    service.prepareFromResolved(resolved(), c, true);
    service.applyData(c, false);
    expect(c.asReadonly().state()).toBe('empty');
  });

  it('applyData transitions empty→ready', () => {
    const c = ctx();
    service.prepareFromResolved(resolved(), c, false);
    service.applyData(c, true);
    expect(c.asReadonly().state()).toBe('ready');
  });

  it('applyError should set error state', () => {
    const c = ctx();
    service.applyError(c, 'network fail');
    expect(c.asReadonly().state()).toBe('error');
    expect(c.asReadonly().errorMessage()).toBe('network fail');
  });

  it('applyData when in error state should do nothing', () => {
    const c = ctx();
    service.applyError(c, 'oops');
    service.applyData(c, true);
    expect(c.asReadonly().state()).toBe('error');
  });

  it('prepareFromResolved with no data should still populate the plan', () => {
    const c = ctx();
    service.prepareFromResolved(resolved(), c, false);
    expect(c.asReadonly().plan()).not.toBeNull();
  });

  it('prepareFromId should reject with unknown tableId', async () => {
    const c = ctx();
    await expectAsync(service.prepareFromId('unknown-tbl', c, false))
      .toBeRejectedWithError();
  });
});
