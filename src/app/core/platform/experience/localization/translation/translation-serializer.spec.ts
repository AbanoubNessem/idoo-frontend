import { TestBed } from '@angular/core/testing';
import { TranslationSerializerService } from './translation-serializer.service';
import { TranslationNamespace }         from './translation.types';

const NS: TranslationNamespace = {
  namespace: 'common',
  locale:    'en-US',
  data:      { save: 'Save', nested: { key: 'Value' } },
  version:   '1.0',
};

describe('TranslationSerializerService', () => {
  let svc: TranslationSerializerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(TranslationSerializerService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('serializes to valid JSON', () => {
    const json = svc.serialize(NS);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes schemaVersion in output', () => {
    const json = svc.serialize(NS);
    expect(JSON.parse(json).schemaVersion).toBe('1.0');
  });

  it('round-trips a namespace', () => {
    const json = svc.serialize(NS);
    const back = svc.deserialize(json);
    expect(back.namespace).toBe('common');
    expect(back.locale).toBe('en-US');
    expect(back.data['save']).toBe('Save');
  });

  it('deserializes bare {locale, data} format', () => {
    const bare = JSON.stringify({ locale: 'en-US', data: { hello: 'Hello' } });
    const back = svc.deserialize(bare);
    expect(back.locale).toBe('en-US');
    expect(back.data['hello']).toBe('Hello');
  });

  it('throws on invalid JSON', () => {
    expect(() => svc.deserialize('not-json')).toThrowError(/Invalid JSON/);
  });

  it('throws when JSON is not a namespace', () => {
    expect(() => svc.deserialize('"just a string"')).toThrowError(/valid TranslationNamespace/);
  });

  it('flatten() produces dot-path keys', () => {
    const flat = svc.flatten({ a: { b: { c: 'deep' } }, top: 'level' });
    expect(flat['a.b.c']).toBe('deep');
    expect(flat['top']).toBe('level');
  });

  it('unflatten() reconstructs nested structure', () => {
    const flat   = { 'a.b': 'AB', 'c': 'C' };
    const nested = svc.unflatten(flat);
    expect((nested['a'] as Record<string, string>)['b']).toBe('AB');
    expect(nested['c']).toBe('C');
  });

  it('mergeNamespaces() gives priority to override', () => {
    const base     = { save: 'Save', cancel: 'Cancel' };
    const override = { save: 'Speichern' };
    const result   = svc.mergeNamespaces(base, override);
    expect(result['save']).toBe('Speichern');
    expect(result['cancel']).toBe('Cancel');
  });

  it('mergeNamespaces() merges nested objects', () => {
    const base     = { btn: { save: 'Save', cancel: 'Cancel' } };
    const override = { btn: { save: 'Speichern' } };
    const result   = svc.mergeNamespaces(base, override);
    const btn = result['btn'] as Record<string, string>;
    expect(btn['save']).toBe('Speichern');
    expect(btn['cancel']).toBe('Cancel');
  });
});
