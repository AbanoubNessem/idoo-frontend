import { TestBed } from '@angular/core/testing';
import { TableSerializerService } from '../serializer/table-serializer.service';
import { TableDefinition } from '../table.types';

const def: TableDefinition = {
  id:      'invoices',
  name:    'Invoices',
  version: '1.0.0',
  columns: [
    { id: 'id',     field: 'id',     header: 'ID',     type: 'text',     visible: true  },
    { id: 'amount', field: 'amount', header: 'Amount', type: 'currency', visible: false },
  ],
  permissions: { view: 'invoice:read', edit: 'invoice:write' },
};

describe('TableSerializerService', () => {
  let service: TableSerializerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableSerializerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── serialize ────────────────────────────────────────────────────────────

  it('should serialize to a JSON string', () => {
    const json = service.serialize(def);
    expect(typeof json).toBe('string');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should produce pretty-printed JSON with pretty:true', () => {
    const json = service.serialize(def, { pretty: true });
    expect(json).toContain('\n');
  });

  it('should exclude hidden columns by default', () => {
    const json   = service.serialize(def);
    const parsed = JSON.parse(json) as { columns: { id: string }[] };
    expect(parsed.columns.find(c => c.id === 'amount')).toBeUndefined();
    expect(parsed.columns.find(c => c.id === 'id')).toBeTruthy();
  });

  it('should include hidden columns when includeHidden:true', () => {
    const json   = service.serialize(def, { includeHidden: true });
    const parsed = JSON.parse(json) as { columns: { id: string }[] };
    expect(parsed.columns.length).toBe(2);
  });

  it('should omit specified columns', () => {
    const json   = service.serialize(def, { includeHidden: true, omitColumns: ['amount'] });
    const parsed = JSON.parse(json) as { columns: { id: string }[] };
    expect(parsed.columns.find(c => c.id === 'amount')).toBeUndefined();
  });

  it('should exclude permissions by default', () => {
    const json   = service.serialize(def);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed['permissions']).toBeUndefined();
  });

  it('should include permissions when includePermissions:true', () => {
    const json   = service.serialize(def, { includePermissions: true });
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed['permissions']).toBeTruthy();
  });

  // ─── deserialize ──────────────────────────────────────────────────────────

  it('should deserialize valid JSON', () => {
    const json   = service.serialize(def, { includeHidden: true });
    const result = service.deserialize(json);
    expect(result.id).toBe('invoices');
  });

  it('should throw on invalid JSON', () => {
    expect(() => service.deserialize('NOT JSON')).toThrowError(/Invalid JSON/);
  });

  it('should throw in strict mode if id is missing', () => {
    const json = JSON.stringify({ name: 'No ID', columns: [] });
    expect(() => service.deserialize(json, { strict: true })).toThrowError(/id/);
  });

  it('should throw in strict mode if name is missing', () => {
    const json = JSON.stringify({ id: 'x', columns: [] });
    expect(() => service.deserialize(json, { strict: true })).toThrowError(/name/);
  });

  it('should throw in strict mode if columns is not an array', () => {
    const json = JSON.stringify({ id: 'x', name: 'Y' });
    expect(() => service.deserialize(json, { strict: true })).toThrowError(/columns/);
  });

  it('should throw if input is not an object', () => {
    expect(() => service.deserialize('[]')).toThrowError(/plain object/);
    expect(() => service.deserialize('"string"')).toThrowError(/plain object/);
  });

  // ─── toObject / fromObject ────────────────────────────────────────────────

  it('toObject should return a plain object', () => {
    const obj = service.toObject(def, { includeHidden: true });
    expect(typeof obj).toBe('object');
    expect(obj['id']).toBe('invoices');
  });

  it('fromObject should reconstruct a definition', () => {
    const obj  = service.toObject(def, { includeHidden: true });
    const back = service.fromObject(obj);
    expect(back.id).toBe('invoices');
  });

  // ─── clone ────────────────────────────────────────────────────────────────

  it('should clone a definition (deep copy)', () => {
    const cloned = service.clone(def);
    expect(cloned).toEqual(def);
    expect(cloned).not.toBe(def);
  });

  // ─── roundtrip ────────────────────────────────────────────────────────────

  it('should survive a serialize → deserialize roundtrip', () => {
    const json    = service.serialize(def, { includeHidden: true, includePermissions: true });
    const roundtrip = service.deserialize(json);
    expect(roundtrip.id).toBe(def.id);
    expect(roundtrip.name).toBe(def.name);
  });
});
