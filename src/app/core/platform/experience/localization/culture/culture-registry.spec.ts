import { TestBed } from '@angular/core/testing';
import { CultureRegistryService } from './culture-registry.service';
import {
  CULTURE_EN_US, CULTURE_AR_SA, CULTURE_DE_DE, DEFAULT_CULTURE_CODE,
} from './culture.constants';
import { CultureDefinition } from './culture.types';

describe('CultureRegistryService', () => {
  let svc: CultureRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(CultureRegistryService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('auto-registers all built-in cultures', () => {
    expect(svc.has('en-US')).toBeTrue();
    expect(svc.has('ar-SA')).toBeTrue();
    expect(svc.has('de-DE')).toBeTrue();
    expect(svc.has('fr-FR')).toBeTrue();
    expect(svc.has('zh-CN')).toBeTrue();
  });

  it('all() returns at least 6 built-in cultures', () => {
    expect(svc.all().length).toBeGreaterThanOrEqual(6);
  });

  it('defaultCulture() returns en-US', () => {
    expect(svc.defaultCulture()?.code).toBe(DEFAULT_CULTURE_CODE);
  });

  it('get() retrieves by exact code', () => {
    expect(svc.get('en-US')).toEqual(CULTURE_EN_US);
  });

  it('get() resolves bare language code to a matching culture', () => {
    const match = svc.get('en');
    expect(match?.language).toBe('en');
  });

  it('get() returns null for unknown code', () => {
    expect(svc.get('xx-XX')).toBeNull();
  });

  it('byLanguage() returns cultures for that language', () => {
    const ar = svc.byLanguage('ar');
    expect(ar.length).toBeGreaterThan(0);
    expect(ar.every(c => c.language === 'ar')).toBeTrue();
  });

  it('byRegion() returns cultures for that region', () => {
    const sa = svc.byRegion('SA');
    expect(sa.length).toBeGreaterThan(0);
    expect(sa.every(c => c.region === 'SA')).toBeTrue();
  });

  it('rtlCultures() returns only rtl cultures', () => {
    const rtl = svc.rtlCultures();
    expect(rtl.length).toBeGreaterThan(0);
    expect(rtl.every(c => c.direction === 'rtl')).toBeTrue();
  });

  it('byTag() finds cultures by tag', () => {
    const builtIn = svc.byTag('built-in');
    expect(builtIn.length).toBeGreaterThanOrEqual(6);
  });

  it('registers a custom culture', () => {
    const custom: CultureDefinition = {
      ...CULTURE_EN_US,
      code:   'custom-LC',
      name:   'Custom Locale',
      region: 'LC',
    };
    svc.register(custom);
    expect(svc.has('custom-LC')).toBeTrue();
    expect(svc.get('custom-LC')?.name).toBe('Custom Locale');
  });

  it('register() throws on missing code', () => {
    const bad = { ...CULTURE_EN_US, code: '' } as CultureDefinition;
    expect(() => svc.register(bad)).toThrowError(/code is required/);
  });

  it('register(isDefault) changes the default culture', () => {
    const custom: CultureDefinition = { ...CULTURE_DE_DE, code: 'de-AT', name: 'German (Austria)', region: 'AT' };
    svc.register(custom, { isDefault: true });
    expect(svc.defaultCulture()?.code).toBe('de-AT');
  });

  it('unregister() removes a culture', () => {
    const custom: CultureDefinition = { ...CULTURE_EN_US, code: 'to-remove', name: 'Remove Me' };
    svc.register(custom);
    svc.unregister('to-remove');
    expect(svc.has('to-remove')).toBeFalse();
  });

  it('count() returns total registered count', () => {
    const before = svc.count();
    svc.register({ ...CULTURE_EN_US, code: 'extra-LC', name: 'Extra' });
    expect(svc.count()).toBe(before + 1);
  });
});
