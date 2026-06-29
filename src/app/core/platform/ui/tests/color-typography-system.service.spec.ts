import { TestBed } from '@angular/core/testing';
import { ColorSystemService } from '../tokens/color-system.service';
import { TypographySystemService } from '../tokens/typography-system.service';
import { DesignTokenRegistryService } from '../tokens/design-token-registry.service';

describe('ColorSystemService', () => {
  let service: ColorSystemService;
  let registry: DesignTokenRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ColorSystemService, DesignTokenRegistryService],
    });
    service  = TestBed.inject(ColorSystemService);
    registry = TestBed.inject(DesignTokenRegistryService);
  });

  it('should create', () => expect(service).toBeTruthy());

  describe('palettes', () => {
    it('should include blue palette', () => {
      expect(service.getPalette('blue')).toBeTruthy();
    });

    it('should include slate palette', () => {
      expect(service.getPalette('slate')).toBeTruthy();
    });

    it('should return null for unknown palette', () => {
      expect(service.getPalette('magenta')).toBeNull();
    });

    it('should return a specific shade', () => {
      const shade = service.getPaletteShade('blue', 500);
      expect(shade).toBe('#3b82f6');
    });

    it('should return null for unknown shade', () => {
      expect(service.getPaletteShade('blue', 999 as never)).toBeNull();
    });
  });

  describe('semantic tokens', () => {
    it('should provide light semantic color map', () => {
      const map = service.getLightSemanticTokens();
      expect(map['primary']).toBeTruthy();
      expect(map['error']).toBeTruthy();
      expect(map['surface']).toBe('#ffffff');
    });

    it('should provide dark semantic color map', () => {
      const map = service.getDarkSemanticTokens();
      expect(map['background']).toBeTruthy();
      expect(map['text-inverse']).toBeTruthy();
    });

    it('should get semantic color for light mode', () => {
      const color = service.getSemanticColor('primary', 'light');
      expect(color).toBeTruthy();
    });

    it('should get semantic color for dark mode', () => {
      const color = service.getSemanticColor('error', 'dark');
      expect(color).toBeTruthy();
    });

    it('should return empty string for unknown semantic color', () => {
      expect(service.getSemanticColor('nonexistent' as never)).toBe('');
    });
  });

  describe('registerLightTokens', () => {
    it('should register all light color tokens in the registry', () => {
      service.registerLightTokens();
      const colorTokens = registry.getByCategory('color');
      expect(colorTokens.length).toBeGreaterThan(10);
    });
  });

  describe('registerDarkTokens', () => {
    it('should register all dark color tokens in the registry', () => {
      service.registerDarkTokens();
      const colorTokens = registry.getByCategory('color');
      expect(colorTokens.length).toBeGreaterThan(10);
    });
  });
});

describe('TypographySystemService', () => {
  let service: TypographySystemService;
  let registry: DesignTokenRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TypographySystemService, DesignTokenRegistryService],
    });
    service  = TestBed.inject(TypographySystemService);
    registry = TestBed.inject(DesignTokenRegistryService);
  });

  it('should create', () => expect(service).toBeTruthy());

  it('should return full scale', () => {
    const scale = service.getScale();
    expect(scale).toBeTruthy();
    expect(scale['body-medium']).toBeTruthy();
  });

  it('should return a specific type spec', () => {
    const spec = service.getSpec('display-large');
    expect(spec?.fontSize).toBeTruthy();
    expect(spec?.fontWeight).toBe(400);
  });

  it('should return null for unknown scale', () => {
    expect(service.getSpec('unknown-scale' as never)).toBeNull();
  });

  it('should expose system font family', () => {
    expect(service.systemFont).toBeTruthy();
    expect(service.systemFont).toContain('Roboto');
  });

  it('should expose mono font family', () => {
    expect(service.monoFont).toBeTruthy();
    expect(service.monoFont.toLowerCase()).toContain('mono');
  });

  it('should return all 15 type scales', () => {
    const scales = service.getAllScales();
    expect(scales.length).toBe(15);
  });

  it('should register typography tokens', () => {
    service.registerTokens();
    const typographyTokens = registry.getByCategory('typography');
    expect(typographyTokens.length).toBeGreaterThan(30);
  });

  it('should include font-family tokens', () => {
    service.registerTokens();
    expect(registry.has('typography.font-family.system')).toBeTrue();
    expect(registry.has('typography.font-family.mono')).toBeTrue();
  });
});
