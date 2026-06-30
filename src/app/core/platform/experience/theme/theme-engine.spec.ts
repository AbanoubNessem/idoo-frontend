import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeEngineService }   from './theme-engine.service';
import { ThemeRegistryService } from './theme-registry.service';
import { THEME_AUTO_APPLY, THEME_INITIAL_ID } from './theme.tokens';
import { PLATFORM_LIGHT_THEME, PLATFORM_DARK_THEME } from './theme.constants';
import { ThemeDefinition } from './theme.types';

describe('ThemeEngineService', () => {
  let engine: ThemeEngineService;
  let doc:    Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: THEME_AUTO_APPLY,  useValue: false },
        { provide: THEME_INITIAL_ID,  useValue: null },
      ],
    });
    engine = TestBed.inject(ThemeEngineService);
    doc    = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    // Clean up DOM attributes
    doc.documentElement.removeAttribute('data-theme');
    doc.documentElement.removeAttribute('data-theme-id');
  });

  it('is created', () => expect(engine).toBeTruthy());

  it('effectiveTheme defaults to the platform light theme', () => {
    const eff = engine.effectiveTheme();
    expect(eff.id).toBe('platform-light');
  });

  it('activeVariant is "light" by default', () => {
    expect(engine.activeVariant()).toBe('light');
  });

  it('isDark is false by default', () => {
    expect(engine.isDark()).toBeFalse();
  });

  it('isHighContrast is false by default', () => {
    expect(engine.isHighContrast()).toBeFalse();
  });

  it('setDarkTheme switches to dark variant', () => {
    engine.setDarkTheme();
    expect(engine.isDark()).toBeTrue();
    expect(engine.effectiveTheme().variant).toBe('dark');
  });

  it('setLightTheme switches back to light', () => {
    engine.setDarkTheme();
    engine.setLightTheme();
    expect(engine.activeVariant()).toBe('light');
  });

  it('setHighContrastTheme switches to high-contrast', () => {
    engine.setHighContrastTheme();
    expect(engine.isHighContrast()).toBeTrue();
  });

  it('resetToDefault returns to platform-light', () => {
    engine.setDarkTheme();
    engine.resetToDefault();
    expect(engine.effectiveTheme().id).toBe('platform-light');
  });

  it('register() adds a custom theme', () => {
    const custom: ThemeDefinition = {
      ...PLATFORM_LIGHT_THEME,
      id: 'custom-theme', name: 'Custom',
    };
    engine.register(custom);
    expect(engine.allThemes().some(t => t.id === 'custom-theme')).toBeTrue();
  });

  it('getDefinition() returns a registered theme', () => {
    expect(engine.getDefinition('platform-light')).not.toBeNull();
  });

  it('getDefinition() returns null for unknown theme', () => {
    expect(engine.getDefinition('unknown')).toBeNull();
  });

  it('effectiveTheme has tokens from the active theme', () => {
    engine.setDarkTheme();
    const tokens = engine.effectiveTheme().tokens;
    const darkPrimary = (PLATFORM_DARK_THEME.tokens.colors as Record<string, string>)['primary'];
    expect((tokens.colors as Record<string, string>)['primary']).toBe(darkPrimary);
  });

  it('effectiveTheme.layers contains applied layers', () => {
    const layers = engine.effectiveTheme().layers;
    expect(layers.length).toBeGreaterThan(0);
    expect(layers.some(l => l.applied)).toBeTrue();
  });

  it('getToken() reads a color token from effective theme', () => {
    const primary = engine.getToken('colors', 'primary');
    expect(primary).toBeDefined();
  });

  it('getToken() returns undefined for unknown token', () => {
    expect(engine.getToken('colors', 'nonexistent-token')).toBeUndefined();
  });

  it('emits ThemeChangedEvent on setTheme()', () => {
    let eventReceived = false;
    const sub = engine.events$.subscribe(e => {
      if (e.type === 'theme:changed') eventReceived = true;
    });
    engine.setDarkTheme();
    sub.unsubscribe();
    expect(eventReceived).toBeTrue();
  });

  it('emits ThemeRegisteredEvent on register()', () => {
    let eventReceived = false;
    const sub = engine.events$.subscribe(e => {
      if (e.type === 'theme:registered') eventReceived = true;
    });
    engine.register({ ...PLATFORM_LIGHT_THEME, id: 'new-theme', name: 'New' });
    sub.unsubscribe();
    expect(eventReceived).toBeTrue();
  });

  it('serializeTheme/deserializeTheme round-trips', () => {
    const json = engine.serializeTheme(PLATFORM_LIGHT_THEME);
    const back = engine.deserializeTheme(json);
    expect(back.id).toBe('platform-light');
  });

  it('applyThemeNow sets data-theme attribute on documentElement', () => {
    engine.applyThemeNow('platform-dark');
    expect(doc.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
