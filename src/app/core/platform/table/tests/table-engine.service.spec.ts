import { TestBed } from '@angular/core/testing';
import { TableEngine } from '../engine/table-engine.service';
import { TableDefinition, TableEvent } from '../table.types';

const def: TableDefinition = {
  id:      'sales',
  name:    'Sales',
  version: '1.0.0',
  columns: [
    { id: 'id',     field: 'id',     header: 'ID',     type: 'text'     },
    { id: 'amount', field: 'amount', header: 'Amount', type: 'currency' },
  ],
};

describe('TableEngine', () => {
  let engine: TableEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine = TestBed.inject(TableEngine);
  });

  it('should be created', () => {
    expect(engine).toBeTruthy();
  });

  // ─── Service Facades ──────────────────────────────────────────────────────

  it('should expose Registry facade', () => expect(engine.Registry).toBeTruthy());
  it('should expose MetadataRegistry facade', () => expect(engine.MetadataRegistry).toBeTruthy());
  it('should expose Resolver facade', () => expect(engine.Resolver).toBeTruthy());
  it('should expose Validator facade', () => expect(engine.Validator).toBeTruthy());
  it('should expose Serializer facade', () => expect(engine.Serializer).toBeTruthy());
  it('should expose Diagnostics facade', () => expect(engine.Diagnostics).toBeTruthy());
  it('should expose Metrics facade', () => expect(engine.Metrics).toBeTruthy());

  // ─── register ─────────────────────────────────────────────────────────────

  it('should register a valid definition', () => {
    engine.register(def);
    expect(engine.Registry.has(def.id)).toBeTrue();
  });

  it('should increment registryCount', () => {
    engine.register(def);
    expect(engine.registryCount()).toBe(1);
  });

  it('should throw when registering an invalid definition', () => {
    expect(() => engine.register({ id: '', name: '', columns: [] } as never)).toThrowError(/failed validation/);
  });

  it('should emit TableRegistered event on register', () => {
    let fired: TableEvent | null = null;
    engine.on('sales', 'TableRegistered', e => (fired = e));
    engine.register(def);
    expect(fired).not.toBeNull();
    expect((fired as unknown as TableEvent).type).toBe('TableRegistered');
  });

  // ─── registerLazy ─────────────────────────────────────────────────────────

  it('should register a lazy definition', () => {
    engine.registerLazy('lazy-sales', async () => def);
    expect(engine.Registry.has('lazy-sales')).toBeTrue();
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  it('should remove a registered definition', () => {
    engine.register(def);
    engine.remove(def.id);
    expect(engine.Registry.has(def.id)).toBeFalse();
  });

  it('should emit TableRemoved event on remove', () => {
    let fired: TableEvent | null = null;
    engine.on('*', 'TableRemoved', e => (fired = e));
    engine.register(def);
    engine.remove(def.id);
    expect(fired).not.toBeNull();
  });

  // ─── resolve ──────────────────────────────────────────────────────────────

  it('should resolve a registered definition', async () => {
    engine.register(def);
    const resolved = await engine.resolve(def.id);
    expect(resolved).not.toBeNull();
    expect(resolved!.definition.id).toBe('sales');
  });

  it('should return null for unknown tableId', async () => {
    expect(await engine.resolve('unknown')).toBeNull();
  });

  it('should cache resolved definitions', async () => {
    engine.register(def);
    await engine.resolve(def.id);
    const cached = await engine.resolve(def.id, true);
    expect(cached).not.toBeNull();
    expect(engine.cachedCount()).toBe(1);
  });

  it('should bypass cache when useCache:false', async () => {
    engine.register(def);
    await engine.resolve(def.id, false);
    await engine.resolve(def.id, false);
    // Both calls should work, just without cache
    expect(engine.cachedCount()).toBe(0);
  });

  it('should emit TableResolved event on resolve', async () => {
    let fired: TableEvent | null = null;
    engine.on('*', 'TableResolved', e => (fired = e));
    engine.register(def);
    await engine.resolve(def.id);
    expect(fired).not.toBeNull();
  });

  // ─── resolveSync ──────────────────────────────────────────────────────────

  it('should resolveSync without registry', () => {
    const resolved = engine.resolveSync(def);
    expect(resolved.definition.id).toBe('sales');
    expect(resolved.columns.length).toBe(2);
  });

  // ─── applyOverride ────────────────────────────────────────────────────────

  it('should apply an override and invalidate cache', async () => {
    engine.register(def);
    await engine.resolve(def.id);
    expect(engine.cachedCount()).toBe(1);
    engine.applyOverride(def.id, 'runtime', { density: 'compact' });
    expect(engine.cachedCount()).toBe(0);
  });

  it('should emit TableMetadataChanged on override', () => {
    let fired: TableEvent | null = null;
    engine.on('*', 'TableMetadataChanged', e => (fired = e));
    engine.register(def);
    engine.applyOverride(def.id, 'runtime', { density: 'compact' });
    expect(fired).not.toBeNull();
  });

  // ─── removeOverride ───────────────────────────────────────────────────────

  it('should remove an override', () => {
    engine.register(def);
    engine.applyOverride(def.id, 'runtime', { density: 'compact' });
    engine.removeOverride(def.id, 'runtime');
    expect(engine.MetadataRegistry.hasOverrides(def.id)).toBeFalse();
  });

  // ─── validate ─────────────────────────────────────────────────────────────

  it('should validate and return valid result', () => {
    const result = engine.validate(def);
    expect(result.valid).toBeTrue();
  });

  it('should validate and return errors for invalid definition', () => {
    const result = engine.validate({ id: '', name: '', columns: [] } as never);
    expect(result.valid).toBeFalse();
  });

  // ─── serialize / deserialize ──────────────────────────────────────────────

  it('should serialize a definition', () => {
    const json = engine.serialize(def);
    expect(typeof json).toBe('string');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should deserialize back to a definition', () => {
    const json    = engine.serialize(def, { includeHidden: true });
    const result  = engine.deserialize(json);
    expect(result.id).toBe('sales');
  });

  // ─── invalidateCache ─────────────────────────────────────────────────────

  it('should invalidate cache for a specific tableId', async () => {
    engine.register(def);
    await engine.resolve(def.id);
    engine.invalidateCache(def.id);
    expect(engine.cachedCount()).toBe(0);
  });

  it('should invalidate entire cache when no tableId given', async () => {
    engine.register(def);
    await engine.resolve(def.id);
    engine.invalidateCache();
    expect(engine.cachedCount()).toBe(0);
  });

  // ─── events ───────────────────────────────────────────────────────────────

  it('should unsubscribe from events', () => {
    let count = 0;
    const unsub = engine.on('*', 'TableRegistered', () => count++);
    engine.register(def);
    unsub();
    engine.register({ ...def, id: 'sales2', name: 'Sales 2' });
    expect(count).toBe(1);
  });

  it('should support wildcard table listener', () => {
    let count = 0;
    engine.on('*', 'TableRegistered', () => count++);
    engine.register(def);
    engine.register({ ...def, id: 'sales2', name: 'Sales 2' });
    expect(count).toBe(2);
  });

  it('should support wildcard event listener', () => {
    const events: string[] = [];
    engine.on('sales', '*', e => events.push(e.type));
    engine.register(def);
    expect(events).toContain('TableRegistered');
  });

  // ─── diagnostics ──────────────────────────────────────────────────────────

  it('should enable and disable diagnostics', () => {
    engine.enableDiagnostics();
    expect(engine.Diagnostics.enabled()).toBeTrue();
    engine.disableDiagnostics();
    expect(engine.Diagnostics.enabled()).toBeFalse();
  });

  it('should record a register diagnostic event when enabled', () => {
    engine.enableDiagnostics();
    engine.register(def);
    expect(engine.Diagnostics.forTable(def.id).length).toBeGreaterThan(0);
  });

  // ─── metrics ──────────────────────────────────────────────────────────────

  it('should track registration in metrics', () => {
    engine.register(def);
    const snap = engine.Metrics.snapshot(def.id);
    expect(snap?.registrationCount).toBe(1);
  });

  it('should track resolve in metrics', async () => {
    engine.register(def);
    await engine.resolve(def.id);
    const snap = engine.Metrics.snapshot(def.id);
    expect(snap?.resolveCount).toBe(1);
  });
});
