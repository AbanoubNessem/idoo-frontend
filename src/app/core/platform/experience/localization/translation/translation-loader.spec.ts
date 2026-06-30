import { TestBed } from '@angular/core/testing';
import { TranslationLoaderService } from './translation-loader.service';
import { TRANSLATION_PROVIDERS, TranslationProvider } from './translation.tokens';
import { TranslationMap } from './translation.types';

const COMMON_EN: TranslationMap = { save: 'Save', cancel: 'Cancel' };

const makeProvider = (id: string, data: Record<string, TranslationMap>): TranslationProvider => ({
  id,
  name: id,
  canLoad: (ns, locale) => `${ns}::${locale}` in data || `${ns}::${locale.split('-')[0]}` in data,
  load:    (ns, locale) => {
    const result = data[`${ns}::${locale}`] ?? data[`${ns}::${locale.split('-')[0]}`];
    return result ? Promise.resolve(result) : Promise.reject(new Error('Not found'));
  },
});

describe('TranslationLoaderService', () => {
  let svc: TranslationLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TRANSLATION_PROVIDERS, useValue: [makeProvider('main', { 'common::en-US': COMMON_EN })] },
      ],
    });
    svc = TestBed.inject(TranslationLoaderService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('loads a namespace from a provider', async () => {
    const result = await svc.load('common', 'en-US');
    expect(result.loaded).toBeTrue();
    expect(result.namespace).toBe('common');
    expect(result.locale).toBe('en-US');
  });

  it('returns cached result on second load', async () => {
    await svc.load('common', 'en-US');
    const result = await svc.load('common', 'en-US');
    expect(result.source).toBe('cache');
  });

  it('returns loaded=false when no provider found', async () => {
    const result = await svc.load('unknown', 'xx-XX');
    expect(result.loaded).toBeFalse();
  });

  it('canLoad() returns true when provider matches', () => {
    expect(svc.canLoad('common', 'en-US')).toBeTrue();
  });

  it('canLoad() returns false when no provider matches', () => {
    expect(svc.canLoad('missing', 'en-US')).toBeFalse();
  });

  it('registerProvider() adds a new provider', async () => {
    const p = makeProvider('extra', { 'forms::en-US': { email: 'Email' } });
    svc.registerProvider(p);
    const result = await svc.load('forms', 'en-US');
    expect(result.loaded).toBeTrue();
  });

  it('unregisterProvider() removes a provider', () => {
    const p = makeProvider('temp', { 'temp::en-US': {} });
    svc.registerProvider(p);
    svc.unregisterProvider('temp');
    expect(svc.canLoad('temp', 'en-US')).toBeFalse();
  });

  it('loadMany() loads multiple namespaces', async () => {
    const p = makeProvider('multi', {
      'common::en-US': COMMON_EN,
      'forms::en-US':  { email: 'Email' },
    });
    svc.registerProvider(p);
    const results = await svc.loadMany(['common', 'forms'], 'en-US');
    expect(results.length).toBe(2);
    expect(results.every(r => r.loaded)).toBeTrue();
  });

  it('loadMany() does not throw on partial failures', async () => {
    const results = await svc.loadMany(['common', 'missing'], 'en-US');
    expect(results.length).toBe(2);
    expect(results[0].loaded).toBeTrue();
    expect(results[1].loaded).toBeFalse();
  });
});
