import { TestBed } from '@angular/core/testing';
import { TranslationEngineService } from './translation-engine.service';
import { TranslationNamespace }     from './translation.types';
import { TRANSLATION_PROVIDERS }    from './translation.tokens';

const EN_NS: TranslationNamespace = {
  namespace: 'test',
  locale:    'en-US',
  data: {
    save:     'Save',
    greeting: 'Hello, {{name}}!',
    items: {
      one:   '{{count}} item',
      other: '{{count}} items',
    },
    nested: { deep: { value: 'Deep Value' } },
  },
};

const DE_NS: TranslationNamespace = {
  namespace: 'test',
  locale:    'de-DE',
  data: { save: 'Speichern' },
};

describe('TranslationEngineService', () => {
  let engine: TranslationEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TRANSLATION_PROVIDERS, useValue: [] }],
    });
    engine = TestBed.inject(TranslationEngineService);
    engine.registerNamespace(EN_NS);
    engine.registerNamespace(DE_NS);
  });

  afterEach(() => engine.ngOnDestroy());

  it('is created', () => expect(engine).toBeTruthy());

  it('t() translates a simple key', () => {
    expect(engine.t('test:save', { locale: 'en-US' })).toBe('Save');
  });

  it('t() resolves namespace:key syntax', () => {
    expect(engine.t('test:save', { locale: 'en-US' })).toBe('Save');
  });

  it('t() falls back to the key when not found', () => {
    expect(engine.t('test:missing.key', { locale: 'en-US' })).toBe('test:missing.key');
  });

  it('t() uses a custom fallback', () => {
    expect(engine.t('test:unknown', { locale: 'en-US', fallback: 'N/A' })).toBe('N/A');
  });

  it('t() interpolates {{params}}', () => {
    const result = engine.t('test:greeting', { locale: 'en-US', params: { name: 'Alice' } });
    expect(result).toBe('Hello, Alice!');
  });

  it('t() resolves plural form for count=1', () => {
    const result = engine.t('test:items', { locale: 'en-US', count: 1 });
    expect(result).toBe('1 item');
  });

  it('t() resolves plural form for count=5', () => {
    const result = engine.t('test:items', { locale: 'en-US', count: 5 });
    expect(result).toBe('5 items');
  });

  it('t() traverses dot-path keys', () => {
    const result = engine.t('test:nested.deep.value', { locale: 'en-US' });
    expect(result).toBe('Deep Value');
  });

  it('translate() returns null when key is missing', () => {
    expect(engine.translate('test:missing', { locale: 'en-US' })).toBeNull();
  });

  it('translate() returns translated value', () => {
    expect(engine.translate('test:save', { locale: 'en-US' })).toBe('Save');
  });

  it('has() returns true for existing key', () => {
    expect(engine.has('test:save', 'en-US')).toBeTrue();
  });

  it('has() returns false for missing key', () => {
    expect(engine.has('test:nonexistent', 'en-US')).toBeFalse();
  });

  it('falls back from de-DE to en-US for missing key', () => {
    // 'test:greeting' not in de-DE → falls back to en-US
    const result = engine.t('test:greeting', { locale: 'de-DE', params: { name: 'Klaus' } });
    expect(result).toBe('Hello, Klaus!');
  });

  it('uses de-DE translation when available', () => {
    expect(engine.t('test:save', { locale: 'de-DE' })).toBe('Speichern');
  });

  it('registerNamespace emits translations:loaded event', () => {
    let received = false;
    const sub = engine.events$.subscribe(e => {
      if (e.type === 'translations:loaded') received = true;
    });
    engine.registerNamespace({ namespace: 'new', locale: 'en-US', data: { k: 'v' } });
    sub.unsubscribe();
    expect(received).toBeTrue();
  });

  it('invalidateNamespace emits translations:invalidated event', () => {
    let received = false;
    const sub = engine.events$.subscribe(e => {
      if (e.type === 'translations:invalidated') received = true;
    });
    engine.invalidateNamespace('test', 'en-US');
    sub.unsubscribe();
    expect(received).toBeTrue();
  });

  it('mergeNamespace adds keys to existing namespace', () => {
    engine.mergeNamespace('test', 'en-US', { extra: 'Extra Value' });
    expect(engine.t('test:extra', { locale: 'en-US' })).toBe('Extra Value');
  });

  it('namespaces() lists registered namespaces', () => {
    expect(engine.namespaces()).toContain('test');
    expect(engine.namespaces()).toContain('common');
  });

  it('isLoaded() returns true for loaded namespace', () => {
    expect(engine.isLoaded('test', 'en-US')).toBeTrue();
  });

  it('isLoaded() returns false for unloaded namespace', () => {
    expect(engine.isLoaded('not-loaded', 'en-US')).toBeFalse();
  });

  it('serializeNamespace/deserializeNamespace round-trips', () => {
    const json = engine.serializeNamespace(EN_NS);
    const back = engine.deserializeNamespace(json);
    expect(back.namespace).toBe('test');
    expect(back.locale).toBe('en-US');
  });
});
