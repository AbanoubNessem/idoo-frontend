import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeEngineService } from '../theme/theme-engine.service';
import { ThemeManagerService } from '../theme/theme-manager.service';
import { ThemeRegistryService } from '../theme/theme-registry.service';
import { ColorSystemService } from '../tokens/color-system.service';
import { SpacingSystemService } from '../tokens/spacing-system.service';
import { TypographySystemService } from '../tokens/typography-system.service';
import { DensitySystemService } from '../tokens/density-system.service';
import { DesignTokenRegistryService } from '../tokens/design-token-registry.service';
import { LIGHT_THEME } from '../theme/themes/light.theme';
import { DARK_THEME } from '../theme/themes/dark.theme';
import { BRAND_THEME } from '../theme/themes/brand.theme';
import { Theme } from '../ui.types';

describe('ThemeEngineService', () => {
  let engine: ThemeEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ThemeEngineService, ThemeManagerService, ThemeRegistryService,
        ColorSystemService, SpacingSystemService, TypographySystemService,
        DensitySystemService, DesignTokenRegistryService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    engine = TestBed.inject(ThemeEngineService);
  });

  it('should create', () => expect(engine).toBeTruthy());

  it('should build CSS vars for light theme', () => {
    const vars = engine.buildCssVars(LIGHT_THEME);
    expect(Object.keys(vars).length).toBeGreaterThan(10);
    expect(vars['--platform-color-primary']).toBeTruthy();
    expect(vars['--platform-theme-mode']).toBe('light');
  });

  it('should build CSS vars for dark theme', () => {
    const vars = engine.buildCssVars(DARK_THEME);
    expect(vars['--platform-theme-mode']).toBe('dark');
    expect(vars['--platform-color-background']).toBeTruthy();
  });

  it('should include token overrides from theme', () => {
    const vars = engine.buildCssVars(BRAND_THEME);
    expect(vars['--platform-color-primary']).toBe('#6d28d9');
  });

  it('should apply theme and return CSS vars', () => {
    const mockEl = document.createElement('div');
    const vars = engine.apply(LIGHT_THEME, mockEl);
    expect(vars).toBeTruthy();
    expect(Object.keys(vars).length).toBeGreaterThan(0);
  });

  it('should track applied theme id', () => {
    const mockEl = document.createElement('div');
    engine.apply(LIGHT_THEME, mockEl);
    expect(engine.getAppliedThemeId()).toBe('light');
  });

  it('should add theme CSS class on apply', () => {
    const mockEl = document.createElement('div');
    engine.apply(LIGHT_THEME, mockEl);
    expect(mockEl.classList.contains('platform-theme-light')).toBeTrue();
  });

  it('should replace CSS class when switching themes', () => {
    const mockEl = document.createElement('div');
    engine.apply(LIGHT_THEME, mockEl);
    engine.apply(DARK_THEME, mockEl);
    expect(mockEl.classList.contains('platform-theme-dark')).toBeTrue();
    expect(mockEl.classList.contains('platform-theme-light')).toBeFalse();
  });

  it('should remove CSS vars on remove()', () => {
    const mockEl = document.createElement('div');
    engine.apply(LIGHT_THEME, mockEl);
    engine.remove(LIGHT_THEME, mockEl);
    expect(engine.getAppliedThemeId()).toBeNull();
  });

  it('should include density tokens in CSS vars', () => {
    const vars = engine.buildCssVars(LIGHT_THEME);
    expect(vars['--platform-density-multiplier']).toBeTruthy();
    expect(vars['--platform-density-touch-target']).toBeTruthy();
  });
});

describe('ThemeManagerService', () => {
  let manager: ThemeManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ThemeManagerService, ThemeEngineService, ThemeRegistryService,
        ColorSystemService, SpacingSystemService, TypographySystemService,
        DensitySystemService, DesignTokenRegistryService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    manager = TestBed.inject(ThemeManagerService);
  });

  it('should create', () => expect(manager).toBeTruthy());

  it('should initialize with light theme', () => {
    manager.initialize('light');
    expect(manager.activeThemeId()).toBe('light');
    expect(manager.isDark()).toBeFalse();
  });

  it('should switch to dark theme', () => {
    manager.initialize('light');
    manager.setTheme('dark');
    expect(manager.activeThemeId()).toBe('dark');
    expect(manager.isDark()).toBeTrue();
  });

  it('should toggle between light and dark', () => {
    manager.initialize('light');
    manager.toggleMode();
    expect(manager.isDark()).toBeTrue();
    manager.toggleMode();
    expect(manager.isDark()).toBeFalse();
  });

  it('should throw for unknown theme id', () => {
    expect(() => manager.setTheme('unicorn')).toThrow();
  });

  it('should return active theme object', () => {
    manager.initialize('brand');
    const theme = manager.activeTheme();
    expect(theme?.id).toBe('brand');
  });

  it('should expose themeState signal', () => {
    manager.initialize('light');
    const state = manager.themeState();
    expect(state.activeThemeId).toBe('light');
    expect(state.mode).toBe('light');
  });

  it('should register and apply a custom theme', () => {
    const custom: Theme = {
      id: 'ocean',
      name: 'Ocean',
      mode: 'dark',
      tokens: { colors: { primary: '#0ea5e9' } },
    };
    manager.registerAndApply(custom);
    expect(manager.activeThemeId()).toBe('ocean');
  });

  it('should set mode by switching to matching theme', () => {
    manager.initialize('light');
    manager.setMode('dark');
    expect(manager.activeMode()).toBe('dark');
  });
});
