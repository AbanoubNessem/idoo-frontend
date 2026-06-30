import { TestBed } from '@angular/core/testing';
import { ExperienceRegistryService } from '../experience-registry.service';
import { ThemeProfileStub, LanguageProfileStub } from '../experience.types';

const themeA: ThemeProfileStub   = { id: 'light', name: 'Light', kind: 'theme' };
const themeB: ThemeProfileStub   = { id: 'dark',  name: 'Dark',  kind: 'theme' };
const langEn: LanguageProfileStub = {
  id: 'en', name: 'English', kind: 'language',
  code: 'en', nativeName: 'English', direction: 'ltr',
};
const langAr: LanguageProfileStub = {
  id: 'ar', name: 'Arabic',  kind: 'language',
  code: 'ar', nativeName: 'العربية', direction: 'rtl',
};

describe('ExperienceRegistryService', () => {
  let registry: ExperienceRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    registry = TestBed.inject(ExperienceRegistryService);
  });

  it('registers and retrieves a theme', () => {
    registry.register('theme', themeA);
    expect(registry.get('theme', 'light')).toEqual(themeA);
  });

  it('has() returns true for registered profile', () => {
    registry.register('theme', themeB);
    expect(registry.has('theme', 'dark')).toBeTrue();
  });

  it('has() returns false for unknown profile', () => {
    expect(registry.has('theme', 'neon')).toBeFalse();
  });

  it('unregister() removes a profile', () => {
    registry.register('theme', themeA);
    registry.unregister('theme', 'light');
    expect(registry.has('theme', 'light')).toBeFalse();
  });

  it('all() returns all profiles for a dimension', () => {
    registry.register('theme', themeA);
    registry.register('theme', themeB);
    const all = registry.all('theme');
    expect(all.some(t => t.id === 'light')).toBeTrue();
    expect(all.some(t => t.id === 'dark')).toBeTrue();
  });

  it('registers language profiles independently from theme', () => {
    registry.register('theme', themeA);
    registry.register('language', langEn);
    registry.register('language', langAr);
    expect(registry.get('language', 'ar')?.direction).toBe('rtl');
    expect(registry.all('theme').length).toBe(1);
    expect(registry.all('language').length).toBe(2);
  });

  it('countByDimension() returns per-dimension counts', () => {
    registry.register('theme', themeA);
    registry.register('language', langEn);
    const counts = registry.countByDimension();
    expect(counts['theme']).toBeGreaterThanOrEqual(1);
    expect(counts['language']).toBeGreaterThanOrEqual(1);
  });

  it('defaultFor() returns the marked default', () => {
    registry.register('theme', themeA, { isDefault: true });
    registry.register('theme', themeB);
    expect(registry.defaultFor('theme')?.id).toBe('light');
  });

  it('byTag() filters by tag', () => {
    registry.register('theme', themeA, { tags: ['dark-mode'] });
    registry.register('theme', themeB, { tags: ['dark-mode'] });
    const tagged = registry.byTag('theme', 'dark-mode');
    expect(tagged.length).toBe(2);
  });

  it('clear(dimension) empties one dimension', () => {
    registry.register('theme', themeA);
    registry.register('language', langEn);
    registry.clear('theme');
    expect(registry.all('theme').length).toBe(0);
    expect(registry.all('language').length).toBeGreaterThanOrEqual(1);
  });
});
