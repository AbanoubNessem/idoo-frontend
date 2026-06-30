import { TestBed } from '@angular/core/testing';
import { TranslationValidatorService } from './translation-validator.service';
import { TranslationNamespace } from './translation.types';

const VALID_NS: TranslationNamespace = {
  namespace: 'common',
  locale:    'en-US',
  data:      { save: 'Save', cancel: 'Cancel', greeting: 'Hello, {{name}}!' },
};

describe('TranslationValidatorService', () => {
  let svc: TranslationValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(TranslationValidatorService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('validates a correct namespace as valid', () => {
    expect(svc.validate(VALID_NS).valid).toBeTrue();
  });

  it('reports error for missing namespace', () => {
    const bad = { ...VALID_NS, namespace: '' };
    expect(svc.validate(bad).valid).toBeFalse();
  });

  it('reports error for missing locale', () => {
    const bad = { ...VALID_NS, locale: '' };
    expect(svc.validate(bad).valid).toBeFalse();
  });

  it('reports error when data is not an object', () => {
    const bad = { ...VALID_NS, data: null as unknown as Record<string, string> };
    expect(svc.validate(bad).valid).toBeFalse();
  });

  it('warns on empty string values', () => {
    const ns = { ...VALID_NS, data: { save: '' } };
    const result = svc.validate(ns);
    expect(result.warnings.some(w => w.includes('save'))).toBeTrue();
  });

  it('reports error when plural key is missing "other"', () => {
    const ns: TranslationNamespace = {
      ...VALID_NS,
      data: { items: { one: '{{count}} item' } },  // no "other"
    };
    const result = svc.validate(ns);
    expect(result.errors.some(e => e.includes('other'))).toBeTrue();
  });

  it('accepts plural object with "other" key', () => {
    const ns: TranslationNamespace = {
      ...VALID_NS,
      data: { items: { one: '{{count}} item', other: '{{count}} items' } },
    };
    expect(svc.validate(ns).valid).toBeTrue();
  });

  it('warns on unbalanced interpolation delimiters', () => {
    const ns = { ...VALID_NS, data: { broken: 'Hello {{name' } };
    const result = svc.validate(ns);
    expect(result.warnings.some(w => w.includes('broken'))).toBeTrue();
  });

  it('validateMap() returns keyCount', () => {
    const result = svc.validateMap({ a: 'A', b: { c: 'C', d: 'D' } });
    expect(result.keyCount).toBe(3);
  });

  it('isValid() returns true for valid namespace', () => {
    expect(svc.isValid(VALID_NS)).toBeTrue();
  });

  it('isValid() returns false for invalid namespace', () => {
    expect(svc.isValid({ ...VALID_NS, namespace: '' })).toBeFalse();
  });
});
