import { TestBed } from '@angular/core/testing';
import { LayoutSerializerService } from '../layout-serializer.service';
import { LayoutDefinition } from '../layout.types';

const def: LayoutDefinition = {
  id: 'ser-test',
  type: 'grid',
  config: { grid: { columns: 4 } },
};

describe('LayoutSerializerService', () => {
  let service: LayoutSerializerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutSerializerService);
  });

  it('serializes to valid JSON', () => {
    const json = service.serialize(def);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('serialized JSON contains the definition id', () => {
    const json = service.serialize(def);
    expect(json).toContain('ser-test');
  });

  it('deserializes back to the original definition', () => {
    const json = service.serialize(def);
    const result = service.deserialize(json);
    expect(result.id).toBe(def.id);
    expect(result.config?.grid?.columns).toBe(4);
  });

  it('throws on invalid JSON', () => {
    expect(() => service.deserialize('{ bad json }')).toThrow();
  });

  it('throws on unrecognized schema', () => {
    expect(() => service.deserialize(JSON.stringify({ foo: 'bar' }))).toThrow();
  });

  it('clone creates a new definition with a new id', () => {
    const cloned = service.clone(def, 'cloned-id');
    expect(cloned.id).toBe('cloned-id');
    expect(cloned.config?.grid?.columns).toBe(4);
  });

  it('deserializeAndRegister registers the definition', () => {
    const json = service.serialize({ id: 'reg-test', type: 'flex' });
    const result = service.deserializeAndRegister(json);
    expect(result.id).toBe('reg-test');
  });
});
