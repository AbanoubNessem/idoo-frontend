import { TestBed } from '@angular/core/testing';
import { DynamicFormSerializerService } from '../serializer/dynamic-form-serializer.service';
import { DynamicFormState } from '../state/dynamic-form-state';
import { FormDefinition, ResolvedFormModel } from '../form.types';

const def: FormDefinition = {
  id: 'test', version: '1', mode: 'create', layout: 'simple',
  sections: [{
    id: 's1', layout: 'grid', columns: 1,
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'hidden', label: 'Hidden', type: 'text' },
    ],
  }],
};

function makeResolved(fieldKeys: string[]): ResolvedFormModel {
  const allFields = fieldKeys.map(k => ({
    key: k, label: k, type: 'text' as const, componentType: null,
  }));
  return {
    definition: def,
    sections:   [],
    tabs:       [],
    steps:      [],
    allFields,
    fieldIndex: new Map(allFields.map(f => [f.key, f])),
    resolvedAt: new Date().toISOString(),
  };
}

describe('DynamicFormSerializerService', () => {
  let service: DynamicFormSerializerService;
  let state: DynamicFormState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFormSerializerService);
    state = new DynamicFormState();
    state.initField('name', { value: 'Alice' });
    state.initField('age', { value: 30 });
    state.initField('hidden', { value: 'secret', hidden: true });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should serialize all non-hidden fields by default', () => {
    const resolved = makeResolved(['name', 'age', 'hidden']);
    const result = service.serialize(state, resolved);
    expect(result['name']).toBe('Alice');
    expect(result['age']).toBe(30);
    expect(result['hidden']).toBeUndefined();
  });

  it('should include hidden fields when includeHidden is true', () => {
    const resolved = makeResolved(['name', 'age', 'hidden']);
    const result = service.serialize(state, resolved, { includeHidden: true });
    expect(result['hidden']).toBe('secret');
  });

  it('should serialize only dirty fields when dirtyOnly is true', () => {
    state.setValue('age', 31);
    const resolved = makeResolved(['name', 'age']);
    const result = service.serialize(state, resolved, { dirtyOnly: true });
    expect(result['age']).toBe(31);
    expect(result['name']).toBeUndefined();
  });

  it('should omit keys listed in omitKeys', () => {
    const resolved = makeResolved(['name', 'age']);
    const result = service.serialize(state, resolved, { omitKeys: ['name'] });
    expect(result['name']).toBeUndefined();
    expect(result['age']).toBe(30);
  });

  it('should produce dirty-only patch via toPatch', () => {
    state.setValue('name', 'Bob');
    const resolved = makeResolved(['name', 'age']);
    const patch = service.toPatch(state, resolved);
    expect(patch['name']).toBe('Bob');
    expect(patch['age']).toBeUndefined();
  });

  it('should serialize to JSON string', () => {
    const resolved = makeResolved(['name', 'age']);
    const json = service.toJSON(state, resolved);
    const parsed = JSON.parse(json);
    expect(parsed['name']).toBe('Alice');
  });

  it('should parse JSON back to record', () => {
    const record = service.fromJSON('{"x":1}');
    expect(record['x']).toBe(1);
  });

  it('should return empty object for invalid JSON', () => {
    const record = service.fromJSON('not-json');
    expect(record).toEqual({});
  });

  it('should deserialize data preserving only known field keys', () => {
    const result = service.deserialize({ name: 'Alice', unknown: 'ignored' }, def);
    expect(result['name']).toBe('Alice');
    expect(result['unknown']).toBeUndefined();
  });
});
