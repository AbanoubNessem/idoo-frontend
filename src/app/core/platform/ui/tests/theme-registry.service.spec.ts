import { TestBed } from '@angular/core/testing';
import { ThemeRegistryService } from '../theme/theme-registry.service';
import { Theme } from '../ui.types';

const customTheme: Theme = {
  id: 'custom',
  name: 'Custom',
  mode: 'light',
  tokens: { colors: { primary: '#ff0000' } },
};

describe('ThemeRegistryService', () => {
  let service: ThemeRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ThemeRegistryService] });
    service = TestBed.inject(ThemeRegistryService);
  });

  it('should create', () => expect(service).toBeTruthy());

  it('should have 3 built-in themes on construction', () => {
    expect(service.count).toBe(3);
  });

  it('should include light, dark, and brand themes', () => {
    expect(service.has('light')).toBeTrue();
    expect(service.has('dark')).toBeTrue();
    expect(service.has('brand')).toBeTrue();
  });

  it('should retrieve built-in light theme', () => {
    const t = service.get('light');
    expect(t?.name).toBe('Light');
    expect(t?.mode).toBe('light');
  });

  it('should retrieve built-in dark theme', () => {
    const t = service.get('dark');
    expect(t?.mode).toBe('dark');
  });

  it('should return null for unknown theme', () => {
    expect(service.get('nonexistent')).toBeNull();
  });

  it('should register a custom theme', () => {
    service.register(customTheme);
    expect(service.has('custom')).toBeTrue();
    expect(service.count).toBe(4);
  });

  it('should throw when registering theme with empty id', () => {
    expect(() => service.register({ ...customTheme, id: '' })).toThrow();
    expect(() => service.register({ ...customTheme, id: '   ' })).toThrow();
  });

  it('should return all themes via getAll()', () => {
    const all = service.getAll();
    expect(all.length).toBe(3);
  });

  it('should filter themes by mode', () => {
    service.register(customTheme);
    const lightThemes = service.getByMode('light');
    expect(lightThemes.every(t => t.mode === 'light')).toBeTrue();
    expect(lightThemes.length).toBeGreaterThanOrEqual(2); // light + brand + custom
  });

  it('should remove a custom theme', () => {
    service.register(customTheme);
    expect(service.remove('custom')).toBeTrue();
    expect(service.has('custom')).toBeFalse();
  });

  it('should throw when removing built-in light theme', () => {
    expect(() => service.remove('light')).toThrow();
  });

  it('should throw when removing built-in dark theme', () => {
    expect(() => service.remove('dark')).toThrow();
  });

  it('should return false when removing non-existent theme', () => {
    expect(service.remove('unknown')).toBeFalse();
  });

  it('should overwrite a theme when re-registering same id', () => {
    service.register(customTheme);
    const updated = { ...customTheme, name: 'Custom v2' };
    service.register(updated);
    expect(service.get('custom')?.name).toBe('Custom v2');
    expect(service.count).toBe(4); // Not growing
  });
});
