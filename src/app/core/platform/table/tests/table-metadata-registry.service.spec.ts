import { TestBed } from '@angular/core/testing';
import { TableMetadataRegistryService } from '../registry/table-metadata-registry.service';
import { TableDefinition } from '../table.types';

const base: TableDefinition = {
  id:            'products',
  name:          'Products',
  density:       'default',
  selectionMode: 'none',
  columns:       [{ id: 'id', field: 'id', header: 'ID', type: 'text' }],
};

describe('TableMetadataRegistryService', () => {
  let service: TableMetadataRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableMetadataRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── applyOverride ────────────────────────────────────────────────────────

  it('should apply a layer override', () => {
    service.applyOverride('products', 'runtime', { density: 'compact' });
    expect(service.hasOverrides('products')).toBeTrue();
  });

  it('should increment overrideCount', () => {
    service.applyOverride('products', 'module', { density: 'compact' });
    expect(service.overrideCount()).toBe(1);
  });

  it('should replace an override for the same layer', () => {
    service.applyOverride('products', 'runtime', { density: 'compact' });
    service.applyOverride('products', 'runtime', { density: 'comfortable' });
    const overrides = service.getOverridesFor('products');
    expect(overrides.length).toBe(1);
    expect(overrides[0].patch['density']).toBe('comfortable');
  });

  it('should accumulate overrides across layers', () => {
    service.applyOverride('products', 'platform', { density: 'compact' });
    service.applyOverride('products', 'runtime',  { selectionMode: 'single' });
    expect(service.getOverridesFor('products').length).toBe(2);
  });

  // ─── removeOverride ───────────────────────────────────────────────────────

  it('should remove a specific layer override', () => {
    service.applyOverride('products', 'runtime', { density: 'compact' });
    const removed = service.removeOverride('products', 'runtime');
    expect(removed).toBeTrue();
    expect(service.hasOverrides('products')).toBeFalse();
  });

  it('should return false when removing non-existent override', () => {
    expect(service.removeOverride('products', 'runtime')).toBeFalse();
  });

  // ─── getOverridesFor ──────────────────────────────────────────────────────

  it('should return overrides in resolution order', () => {
    service.applyOverride('products', 'runtime',  { density: 'compact' });
    service.applyOverride('products', 'platform', { density: 'comfortable' });
    const overrides = service.getOverridesFor('products');
    expect(overrides[0].layer).toBe('platform');
    expect(overrides[1].layer).toBe('runtime');
  });

  it('should return empty array for unknown tableId', () => {
    expect(service.getOverridesFor('unknown')).toEqual([]);
  });

  // ─── mergeInto ────────────────────────────────────────────────────────────

  it('should return base unchanged when no overrides', () => {
    const merged = service.mergeInto(base);
    expect(merged).toEqual(base);
  });

  it('should apply single layer override', () => {
    service.applyOverride('products', 'runtime', { density: 'compact' });
    const merged = service.mergeInto(base);
    expect(merged.density).toBe('compact');
    expect(merged.id).toBe('products');
  });

  it('should apply runtime override wins over platform', () => {
    service.applyOverride('products', 'platform', { density: 'comfortable' });
    service.applyOverride('products', 'runtime',  { density: 'compact' });
    const merged = service.mergeInto(base);
    expect(merged.density).toBe('compact');
  });

  it('should preserve id and name from base even if patch provides them', () => {
    service.applyOverride('products', 'runtime', { density: 'compact' } as never);
    const merged = service.mergeInto(base);
    expect(merged.id).toBe('products');
    expect(merged.name).toBe('Products');
  });

  // ─── clearForTable / clearAll ────────────────────────────────────────────

  it('should clear overrides for a specific table', () => {
    service.applyOverride('products', 'runtime', { density: 'compact' });
    service.clearForTable('products');
    expect(service.hasOverrides('products')).toBeFalse();
  });

  it('should clearAll remove all overrides', () => {
    service.applyOverride('products', 'runtime', { density: 'compact' });
    service.applyOverride('orders',   'module',  { selectionMode: 'multiple' });
    service.clearAll();
    expect(service.overrideCount()).toBe(0);
  });

  // ─── listTableIds ─────────────────────────────────────────────────────────

  it('should list all table ids with overrides', () => {
    service.applyOverride('products', 'runtime', { density: 'compact' });
    service.applyOverride('orders',   'module',  { selectionMode: 'multiple' });
    expect(service.listTableIds().sort()).toEqual(['orders', 'products']);
  });
});
