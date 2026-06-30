import { TestBed } from '@angular/core/testing';
import { ThemeLoaderService } from './theme-loader.service';
import { THEME_PROVIDERS, ThemeProvider } from './theme.tokens';
import { ThemeDefinition } from './theme.types';
import { PLATFORM_LIGHT_THEME } from './theme.constants';

const makeProvider = (id: string, themes: ThemeDefinition[]): ThemeProvider => ({
  id,
  name: id,
  canLoad: (themeId) => themes.some(t => t.id === themeId),
  load:    (themeId) => {
    const t = themes.find(t => t.id === themeId);
    return t ? Promise.resolve(t) : Promise.reject(new Error(`Not found: ${themeId}`));
  },
});

describe('ThemeLoaderService', () => {
  let svc: ThemeLoaderService;
  const lightProvider = makeProvider('light-provider', [PLATFORM_LIGHT_THEME]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: THEME_PROVIDERS, useValue: [lightProvider] }],
    });
    svc = TestBed.inject(ThemeLoaderService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('loads a theme from a registered provider', async () => {
    const theme = await svc.load('platform-light');
    expect(theme.id).toBe('platform-light');
  });

  it('returns cached theme on second load', async () => {
    const t1 = await svc.load('platform-light');
    const t2 = await svc.load('platform-light');
    expect(t1).toBe(t2);
  });

  it('forces reload when force=true', async () => {
    await svc.load('platform-light');
    const t2 = await svc.load('platform-light', { force: true });
    expect(t2.id).toBe('platform-light');
  });

  it('throws when no provider can load the theme', async () => {
    await expectAsync(svc.load('nonexistent')).toBeRejectedWithError(/No provider/);
  });

  it('canLoad() returns true when a provider matches', () => {
    expect(svc.canLoad('platform-light')).toBeTrue();
  });

  it('canLoad() returns false when no provider matches', () => {
    expect(svc.canLoad('unknown-theme')).toBeFalse();
  });

  it('registerProvider adds a new provider', async () => {
    const darkTheme: ThemeDefinition = { ...PLATFORM_LIGHT_THEME, id: 'custom-dark', name: 'Dark' };
    const provider   = makeProvider('dark-provider', [darkTheme]);
    svc.registerProvider(provider);
    const loaded = await svc.load('custom-dark');
    expect(loaded.id).toBe('custom-dark');
  });

  it('unregisterProvider removes a provider', async () => {
    const t: ThemeDefinition = { ...PLATFORM_LIGHT_THEME, id: 'temp-theme', name: 'Temp' };
    const p = makeProvider('temp-provider', [t]);
    svc.registerProvider(p);
    svc.unregisterProvider('temp-provider');
    expect(svc.canLoad('temp-theme')).toBeFalse();
  });

  it('loadMany loads multiple themes', async () => {
    const t2: ThemeDefinition = { ...PLATFORM_LIGHT_THEME, id: 'theme-2', name: 'T2' };
    const p2 = makeProvider('p2', [t2]);
    svc.registerProvider(p2);
    const results = await svc.loadMany(['platform-light', 'theme-2']);
    expect(results.length).toBe(2);
  });

  it('loadMany skips failed themes gracefully', async () => {
    const results = await svc.loadMany(['platform-light', 'nonexistent']);
    expect(results.length).toBe(1);
  });
});
