import { TestBed } from '@angular/core/testing';
import { TableToolbarRendererService } from '../renderers/table-toolbar-renderer.service';
import { TableActionDefinition, TableToolbarDefinition } from '../../table.types';

const toolbar: TableToolbarDefinition = {
  search:           true,
  searchPlaceholder: 'Find...',
  density:          true,
  columnVisibility: true,
  export:           true,
  print:            true,
  refresh:          true,
};

const action: TableActionDefinition = {
  id: 'add', label: 'Add', type: 'primary', position: 'toolbar',
};

describe('TableToolbarRendererService', () => {
  let service: TableToolbarRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableToolbarRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── buildToolbarNode ─────────────────────────────────────────────────────

  it('should return null when no toolbar and no actions', () => {
    expect(service.buildToolbarNode(undefined, [])).toBeNull();
  });

  it('should build a toolbar node from toolbar definition', () => {
    const result = service.buildToolbarNode(toolbar, []);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('toolbar');
    expect(result!.showSearch).toBeTrue();
    expect(result!.showDensity).toBeTrue();
  });

  it('should set searchPlaceholder correctly', () => {
    expect(service.buildToolbarNode(toolbar, [])!.searchPlaceholder).toBe('Find...');
  });

  it('should use "Search..." as default placeholder', () => {
    expect(service.buildToolbarNode({}, [])!.searchPlaceholder).toBe('Search...');
  });

  it('should default all flags to false when toolbar is empty object', () => {
    const n = service.buildToolbarNode({}, [])!;
    expect(n.showSearch).toBeFalse();
    expect(n.showDensity).toBeFalse();
    expect(n.showExport).toBeFalse();
    expect(n.showPrint).toBeFalse();
    expect(n.showRefresh).toBeFalse();
    expect(n.showColumnPicker).toBeFalse();
  });

  it('should include visible actions', () => {
    const result = service.buildToolbarNode(undefined, [action]);
    expect(result).not.toBeNull();
    expect(result!.toolbarActions.length).toBe(1);
    expect(result!.toolbarActions[0].actionId).toBe('add');
  });

  it('should exclude actions with visible:false', () => {
    const hiddenAction: TableActionDefinition = { ...action, id: 'hidden', visible: false };
    const result = service.buildToolbarNode(undefined, [action, hiddenAction]);
    expect(result!.toolbarActions.length).toBe(1);
    expect(result!.toolbarActions[0].actionId).toBe('add');
  });

  it('should evaluate function visible and include if true', () => {
    const fn: TableActionDefinition = { ...action, id: 'fn', visible: () => true };
    expect(service.buildToolbarNode(undefined, [fn])!.toolbarActions.length).toBe(1);
  });

  it('should evaluate function visible and exclude if false', () => {
    const fn: TableActionDefinition = { ...action, id: 'fn', visible: () => false };
    expect(service.buildToolbarNode(undefined, [fn])).toBeNull();
  });

  it('should map action fields correctly', () => {
    const result = service.buildToolbarNode(undefined, [action]);
    const node = result!.toolbarActions[0];
    expect(node.type).toBe('action');
    expect(node.variant).toBe('primary');
    expect(node.label).toBe('Add');
  });

  it('should build when toolbar has both toolbar config and actions', () => {
    const result = service.buildToolbarNode(toolbar, [action]);
    expect(result!.showSearch).toBeTrue();
    expect(result!.toolbarActions.length).toBe(1);
  });
});
