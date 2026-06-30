import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslationCacheService } from './translation-cache.service';
import { TRANSLATION_CACHE_TTL_MS } from './translation.tokens';
import { TranslationMap } from './translation.types';

const DATA: TranslationMap = { save: 'Save', cancel: 'Cancel' };

describe('TranslationCacheService', () => {
  let svc: TranslationCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TRANSLATION_CACHE_TTL_MS, useValue: 200 }],
    });
    svc = TestBed.inject(TranslationCacheService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('stores and retrieves a namespace', () => {
    svc.set('common', 'en-US', DATA);
    expect(svc.get('common', 'en-US')).toEqual(DATA);
  });

  it('returns null for unknown namespace', () => {
    expect(svc.get('unknown', 'en-US')).toBeNull();
  });

  it('has() returns true for cached entry', () => {
    svc.set('common', 'en-US', DATA);
    expect(svc.has('common', 'en-US')).toBeTrue();
  });

  it('has() returns false for uncached entry', () => {
    expect(svc.has('missing', 'en-US')).toBeFalse();
  });

  it('expires after TTL', fakeAsync(() => {
    svc.set('common', 'en-US', DATA);
    tick(300);
    expect(svc.get('common', 'en-US')).toBeNull();
  }));

  it('has() evicts on expiry', fakeAsync(() => {
    svc.set('common', 'en-US', DATA);
    tick(300);
    expect(svc.has('common', 'en-US')).toBeFalse();
  }));

  it('invalidate(ns, locale) removes specific entry', () => {
    svc.set('common', 'en-US', DATA);
    svc.invalidate('common', 'en-US');
    expect(svc.get('common', 'en-US')).toBeNull();
  });

  it('invalidate(ns) removes all locales for namespace', () => {
    svc.set('common', 'en-US', DATA);
    svc.set('common', 'de-DE', DATA);
    svc.invalidate('common');
    expect(svc.has('common', 'en-US')).toBeFalse();
    expect(svc.has('common', 'de-DE')).toBeFalse();
  });

  it('clear() removes all entries', () => {
    svc.set('common', 'en-US', DATA);
    svc.set('forms',  'de-DE', DATA);
    svc.clear();
    expect(svc.size()).toBe(0);
  });

  it('size() returns correct count', () => {
    svc.set('a', 'en-US', DATA);
    svc.set('b', 'en-US', DATA);
    expect(svc.size()).toBe(2);
  });

  it('stats() returns hit counts', () => {
    svc.set('common', 'en-US', DATA);
    svc.get('common', 'en-US');
    svc.get('common', 'en-US');
    const stats = svc.stats();
    const entry = stats.find(s => s.namespace === 'common' && s.locale === 'en-US');
    expect(entry?.hitCount).toBe(2);
  });
});
