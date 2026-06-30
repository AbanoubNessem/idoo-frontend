import { TestBed } from '@angular/core/testing';
import { ThemeRegistryService } from './theme-registry.service';
import {
  PLATFORM_LIGHT_THEME,
  PLATFORM_DARK_THEME,
  PLATFORM_HIGH_CONTRAST_THEME,
  DEFAULT_PLATFORM_THEME_ID,
} from './theme.constants';
import { ThemeDefinition } from './theme.types';

describe('ThemeRegistryService', () => {
  let svc: ThemeRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ThemeRegistryService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('auto-registers all built-in themes', () => {
    expect(svc.has('platform-light')).toBeTrue();
    expect(svc.has('platform-dark')).toBeTrue();
    expect(svc.has('platform-high-contrast')).toBeTrue();
  });

  it('all() returns built-in themes', () => {
    const all = svc.all();
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  it('defaultTheme() returns the platform light theme', () => {
    const def = svc.defaultTheme();
    expect(def?.id).toBe(DEFAULT_PLATFORM_THEME_ID);
  });

  it('byKind("light") returns light themes', () => {
    const lights = svc.byKind('light');
    expect(lights.length).toBeGreaterThan(0);
    expect(lights.every(t => t.variant === 'light')).toBeTrue();
  });

  it('byKind("dark") returns dark themes', () => {
    const darks = svc.byKind('dark');
    expect(darks.every(t => t.variant === 'dark')).toBeTrue();
  });

  it('byKind("high-contrast") returns high-contrast themes', () => {
    const hc = svc.byKind('high-contrast');
    expect(hc.length).toBeGreaterThan(0);
  });

  it('registers a custom theme', () => {
    const custom: ThemeDefinition = {
      ...PLATFORM_LIGHT_THEME,
      id:      'my-brand-theme',
      name:    'Brand Theme',
      variant: 'custom',
    };
    svc.register(custom);
    expect(svc.has('my-brand-theme')).toBeTrue();
    expect(svc.get('my-brand-theme')?.variant).toBe('custom');
  });

  it('throws when registering an invalid theme', () => {
    const bad = { ...PLATFORM_LIGHT_THEME, id: '' } as ThemeDefinition;
    expect(() => svc.register(bad)).toThrowError(/Cannot register/);
  });

  it('count() returns the number of registered themes', () => {
    const before = svc.count();
    svc.register({ ...PLATFORM_LIGHT_THEME, id: 'extra-theme', name: 'Extra' });
    expect(svc.count()).toBe(before + 1);
  });

  it('unregister() removes a custom theme', () => {
    const t: ThemeDefinition = { ...PLATFORM_LIGHT_THEME, id: 'to-remove', name: 'Remove Me' };
    svc.register(t);
    expect(svc.has('to-remove')).toBeTrue();
    svc.unregister('to-remove');
    expect(svc.has('to-remove')).toBeFalse();
  });

  it('byTag() finds themes by tag', () => {
    const builtIn = svc.byTag('built-in');
    expect(builtIn.length).toBeGreaterThanOrEqual(3);
  });
});
