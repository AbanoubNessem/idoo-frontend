import { TestBed } from '@angular/core/testing';
import { TableMetadataRegistryService } from '../registry/table-metadata-registry.service';
import { TableRegistryService } from '../registry/table-registry.service';
import { TableResolverService } from '../resolver/table-resolver.service';
import { TableDefinition } from '../table.types';

const def: TableDefinition = {
  id:      'employees',
  name:    'Employees',
  version: '1.0.0',
  columns: [
    { id: 'id',   field: 'id',   header: 'ID',   type: 'text',   visible: true  },
    { id: 'name', field: 'name', header: 'Name', type: 'text',   visible: true  },
    { id: 'dept', field: 'dept', header: 'Dept', type: 'text',   visible: false },
  ],
};

describe('TableResolverService', () => {
  let service:          TableResolverService;
  let registry:         TableRegistryService;
  let metaRegistry:     TableMetadataRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service      = TestBed.inject(TableResolverService);
    registry     = TestBed.inject(TableRegistryService);
    metaRegistry = TestBed.inject(TableMetadataRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── resolve (async) ──────────────────────────────────────────────────────

  it('should return null for unknown tableId', async () => {
    expect(await service.resolve('nope')).toBeNull();
  });

  it('should resolve a registered definition', async () => {
    registry.register(def);
    const resolved = await service.resolve('employees');
    expect(resolved).not.toBeNull();
    expect(resolved!.definition.id).toBe('employees');
  });

  it('should populate columns array', async () => {
    registry.register(def);
    const resolved = await service.resolve('employees');
    expect(resolved!.columns.length).toBe(3);
  });

  it('should populate visibleColumns (only visible:true or default)', async () => {
    registry.register(def);
    const resolved = await service.resolve('employees');
    expect(resolved!.visibleColumns.length).toBe(2);
  });

  it('should build columnIndex keyed by id', async () => {
    registry.register(def);
    const resolved = await service.resolve('employees');
    expect(resolved!.columnIndex.has('id')).toBeTrue();
    expect(resolved!.columnIndex.has('name')).toBeTrue();
    expect(resolved!.columnIndex.has('dept')).toBeTrue();
  });

  it('should apply column defaults (sortable defaults to false)', async () => {
    registry.register(def);
    const resolved = await service.resolve('employees');
    expect(resolved!.columns[0].sortable).toBeFalse();
  });

  it('should set effectiveVisible correctly', async () => {
    registry.register(def);
    const resolved = await service.resolve('employees');
    expect(resolved!.columns.find(c => c.id === 'dept')!.effectiveVisible).toBeFalse();
    expect(resolved!.columns.find(c => c.id === 'id')!.effectiveVisible).toBeTrue();
  });

  it('should set effectiveEditable to false by default', async () => {
    registry.register(def);
    const resolved = await service.resolve('employees');
    expect(resolved!.columns[0].effectiveEditable).toBeFalse();
  });

  it('should preserve column order index when order is not set', async () => {
    registry.register(def);
    const resolved = await service.resolve('employees');
    expect(resolved!.columns[0].order).toBe(0);
    expect(resolved!.columns[1].order).toBe(1);
  });

  it('should set resolvedAt timestamp', async () => {
    registry.register(def);
    const resolved = await service.resolve('employees');
    expect(resolved!.resolvedAt).toBeTruthy();
    expect(() => new Date(resolved!.resolvedAt)).not.toThrow();
  });

  it('should detect layer from registry entry', async () => {
    registry.register(def, { layer: 'platform' });
    const resolved = await service.resolve('employees');
    expect(resolved!.resolvedLayer).toBe('platform');
  });

  // ─── metadata overrides ───────────────────────────────────────────────────

  it('should apply metadata override before resolution', async () => {
    registry.register(def);
    metaRegistry.applyOverride('employees', 'runtime', { density: 'compact' });
    const resolved = await service.resolve('employees');
    expect(resolved!.definition.density).toBe('compact');
  });

  // ─── resolveSync ──────────────────────────────────────────────────────────

  it('should resolveSync a definition directly', () => {
    const resolved = service.resolveSync(def);
    expect(resolved.definition.id).toBe('employees');
    expect(resolved.columns.length).toBe(3);
    expect(resolved.visibleColumns.length).toBe(2);
  });

  it('should resolveSync with overrides applied', () => {
    metaRegistry.applyOverride('employees', 'runtime', { selectionMode: 'multiple' });
    const resolved = service.resolveSync(def);
    expect(resolved.definition.selectionMode).toBe('multiple');
  });
});
