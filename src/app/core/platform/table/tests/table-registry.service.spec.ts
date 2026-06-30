import { TestBed } from '@angular/core/testing';
import { TableRegistryService } from '../registry/table-registry.service';
import { TableDefinition } from '../table.types';

const base: TableDefinition = {
  id:      'orders',
  name:    'Orders Table',
  columns: [{ id: 'id', field: 'id', header: 'ID', type: 'text' }],
};

describe('TableRegistryService', () => {
  let service: TableRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── register ─────────────────────────────────────────────────────────────

  it('should register a table definition', () => {
    service.register(base);
    expect(service.has(base.id)).toBeTrue();
  });

  it('should increment registeredCount', () => {
    service.register(base);
    expect(service.registeredCount()).toBe(1);
  });

  it('should throw on duplicate without overwrite', () => {
    service.register(base);
    expect(() => service.register(base)).toThrowError(/already registered/);
  });

  it('should allow overwrite', () => {
    service.register(base);
    const updated: TableDefinition = { ...base, name: 'Updated Orders' };
    expect(() => service.register(updated, { overwrite: true })).not.toThrow();
    expect(service.get(base.id)?.definition.name).toBe('Updated Orders');
  });

  it('should store the layer from options', () => {
    service.register(base, { layer: 'platform' });
    expect(service.get(base.id)?.layer).toBe('platform');
  });

  it('should default layer to module', () => {
    service.register(base);
    expect(service.get(base.id)?.layer).toBe('module');
  });

  it('should store tags', () => {
    service.register(base, { tags: ['erp', 'orders'] });
    expect(service.get(base.id)?.tags).toEqual(['erp', 'orders']);
  });

  // ─── registerLazy ─────────────────────────────────────────────────────────

  it('should register a lazy definition', () => {
    service.registerLazy('lazy-orders', async () => ({ ...base, id: 'lazy-orders' }));
    expect(service.has('lazy-orders')).toBeTrue();
  });

  it('should resolve a lazy definition on first access', async () => {
    service.registerLazy('lazy-orders', async () => ({ ...base, id: 'lazy-orders', name: 'Lazy' }));
    const def = await service.resolve('lazy-orders');
    expect(def?.name).toBe('Lazy');
  });

  it('should cache the resolved lazy definition', async () => {
    let callCount = 0;
    service.registerLazy('lazy-orders', async () => {
      callCount++;
      return { ...base, id: 'lazy-orders' };
    });
    await service.resolve('lazy-orders');
    await service.resolve('lazy-orders');
    expect(callCount).toBe(1);
  });

  // ─── resolve ──────────────────────────────────────────────────────────────

  it('should resolve a registered definition', async () => {
    service.register(base);
    const resolved = await service.resolve(base.id);
    expect(resolved).toEqual(base);
  });

  it('should return null for unknown id', async () => {
    expect(await service.resolve('nope')).toBeNull();
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  it('should remove a registered definition', () => {
    service.register(base);
    expect(service.remove(base.id)).toBeTrue();
    expect(service.has(base.id)).toBeFalse();
  });

  it('should decrement count on remove', () => {
    service.register(base);
    service.remove(base.id);
    expect(service.registeredCount()).toBe(0);
  });

  it('should return false when removing unknown id', () => {
    expect(service.remove('nope')).toBeFalse();
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  it('should list all entries', () => {
    service.register(base);
    service.register({ ...base, id: 'invoices', name: 'Invoices' });
    expect(service.list().length).toBe(2);
  });

  it('should list by layer', () => {
    service.register(base, { layer: 'platform' });
    service.register({ ...base, id: 'invoices', name: 'Invoices' }, { layer: 'module' });
    expect(service.listByLayer('platform').length).toBe(1);
    expect(service.listByLayer('module').length).toBe(1);
  });

  // ─── query ────────────────────────────────────────────────────────────────

  it('should query by tags', () => {
    service.register(base, { tags: ['crm', 'orders'] });
    service.register({ ...base, id: 'inv', name: 'Inv' }, { tags: ['finance'] });
    expect(service.query(['crm']).length).toBe(1);
    expect(service.query(['crm', 'orders']).length).toBe(1);
    expect(service.query(['finance']).length).toBe(1);
    expect(service.query(['missing']).length).toBe(0);
  });

  // ─── all computed ──────────────────────────────────────────────────────────

  it('should expose all() as computed signal', () => {
    service.register(base);
    service.register({ ...base, id: 'inv', name: 'Inv' });
    expect(service.all().length).toBe(2);
  });
});
