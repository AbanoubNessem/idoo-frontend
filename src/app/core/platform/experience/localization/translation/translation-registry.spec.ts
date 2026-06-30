import { TestBed } from '@angular/core/testing';
import { TranslationRegistryService } from './translation-registry.service';
import { TranslationNamespace }       from './translation.types';

describe('TranslationRegistryService', () => {
  let svc: TranslationRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(TranslationRegistryService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('has built-in common translations for en-US', () => {
    expect(svc.has('common', 'en-US')).toBeTrue();
  });

  it('resolves a built-in key', () => {
    expect(svc.resolve('common', 'save', 'en-US')).toBe('Save');
  });

  it('register() stores translations', () => {
    const ns: TranslationNamespace = {
      namespace: 'forms',
      locale:    'en-US',
      data:      { email: { label: 'Email' } },
    };
    svc.register(ns);
    expect(svc.has('forms', 'en-US')).toBeTrue();
  });

  it('resolve() traverses dot-path keys', () => {
    svc.register({ namespace: 'nav', locale: 'en-US', data: { menu: { home: 'Home' } } });
    expect(svc.resolve('nav', 'menu.home', 'en-US')).toBe('Home');
  });

  it('resolve() falls back to language code', () => {
    svc.register({ namespace: 'common', locale: 'en', data: { cancel: 'Cancel (en)' } });
    // en-AU not registered → should fall to 'en'
    expect(svc.resolve('common', 'cancel', 'en-AU')).toBe('Cancel (en)');
  });

  it('resolve() falls back to en-US', () => {
    // 'de-AT' not registered; 'de' not registered; should fall to en-US
    const result = svc.resolve('common', 'save', 'de-AT');
    expect(result).toBe('Save');
  });

  it('resolve() returns null when key is missing and no fallback', () => {
    expect(svc.resolve('common', 'nonexistent.key', 'en-US')).toBeNull();
  });

  it('merge() adds keys to existing namespace', () => {
    svc.register({ namespace: 'common', locale: 'de-DE', data: { save: 'Speichern' } });
    svc.merge('common', 'de-DE', { cancel: 'Abbrechen' });
    expect(svc.resolve('common', 'save', 'de-DE')).toBe('Speichern');
    expect(svc.resolve('common', 'cancel', 'de-DE')).toBe('Abbrechen');
  });

  it('unregister(ns, locale) removes that entry', () => {
    svc.register({ namespace: 'temp', locale: 'en-US', data: { k: 'v' } });
    svc.unregister('temp', 'en-US');
    expect(svc.has('temp', 'en-US')).toBeFalse();
  });

  it('unregister(ns) removes all locales', () => {
    svc.register({ namespace: 'multi', locale: 'en-US', data: {} });
    svc.register({ namespace: 'multi', locale: 'de-DE', data: {} });
    svc.unregister('multi');
    expect(svc.has('multi', 'en-US')).toBeFalse();
    expect(svc.has('multi', 'de-DE')).toBeFalse();
  });

  it('namespaces() lists registered namespaces', () => {
    svc.register({ namespace: 'dashboard', locale: 'en-US', data: { title: 'Dashboard' } });
    expect(svc.namespaces()).toContain('dashboard');
    expect(svc.namespaces()).toContain('common');
  });

  it('localesForNamespace() lists locales for a namespace', () => {
    svc.register({ namespace: 'pricing', locale: 'en-US', data: {} });
    svc.register({ namespace: 'pricing', locale: 'de-DE', data: {} });
    const locales = svc.localesForNamespace('pricing');
    expect(locales).toContain('en-US');
    expect(locales).toContain('de-DE');
  });
});
