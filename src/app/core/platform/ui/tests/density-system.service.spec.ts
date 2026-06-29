import { TestBed } from '@angular/core/testing';
import { DensitySystemService } from '../tokens/density-system.service';
import { DesignTokenRegistryService } from '../tokens/design-token-registry.service';
import { SpacingSystemService } from '../tokens/spacing-system.service';

describe('DensitySystemService', () => {
  let service: DensitySystemService;
  let registry: DesignTokenRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DensitySystemService, DesignTokenRegistryService, SpacingSystemService],
    });
    service = TestBed.inject(DensitySystemService);
    registry = TestBed.inject(DesignTokenRegistryService);
  });

  it('should create', () => expect(service).toBeTruthy());

  it('should default to comfortable', () => {
    expect(service.level()).toBe('comfortable');
    expect(service.config().multiplier).toBe(1.0);
  });

  it('should switch to compact', () => {
    service.setLevel('compact');
    expect(service.level()).toBe('compact');
    expect(service.multiplier()).toBe(0.75);
  });

  it('should switch to spacious', () => {
    service.setLevel('spacious');
    expect(service.multiplier()).toBe(1.25);
  });

  it('should return correct config for each level', () => {
    expect(service.getConfig('comfortable').touchTargetPx).toBe(44);
    expect(service.getConfig('compact').touchTargetPx).toBe(36);
    expect(service.getConfig('spacious').touchTargetPx).toBe(52);
  });

  it('should scale a base px value', () => {
    service.setLevel('compact');
    expect(service.scale(40)).toBe(30); // 40 * 0.75 = 30
  });

  it('should convert scaled px to rem', () => {
    service.setLevel('comfortable');
    expect(service.scaleRem(16)).toBe('1rem'); // 16 * 1.0 / 16 = 1rem
  });

  it('should register density tokens on setLevel', () => {
    service.setLevel('compact');
    expect(registry.has('density.level')).toBeTrue();
    expect(registry.has('density.multiplier')).toBeTrue();
  });

  it('should return all available levels', () => {
    const levels = service.getAllLevels();
    expect(levels).toContain('comfortable');
    expect(levels).toContain('compact');
    expect(levels).toContain('spacious');
  });
});

describe('SpacingSystemService', () => {
  let service: SpacingSystemService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpacingSystemService, DesignTokenRegistryService],
    });
    service = TestBed.inject(SpacingSystemService);
  });

  it('should create', () => expect(service).toBeTruthy());

  it('should return 0 px for scale 0', () => {
    expect(service.px(0)).toBe(0);
    expect(service.rem(0)).toBe('0');
  });

  it('should return 4px for scale 1', () => {
    expect(service.px(1)).toBe(4);
    expect(service.rem(1)).toBe('0.25rem');
  });

  it('should return 16px for scale 4', () => {
    expect(service.px(4)).toBe(16);
    expect(service.rem(4)).toBe('1rem');
  });

  it('should return all spacing tokens', () => {
    expect(service.getAll().length).toBeGreaterThan(10);
  });

  it('should convert arbitrary px to token', () => {
    const token = service.fromPx(32);
    expect(token.px).toBe(32);
    expect(token.rem).toBe('2rem');
  });

  it('should register spacing, border-radius, elevation, opacity tokens', () => {
    const registry = TestBed.inject(DesignTokenRegistryService);
    service.registerTokens();
    expect(registry.getByCategory('spacing').length).toBeGreaterThan(0);
    expect(registry.getByCategory('border-radius').length).toBeGreaterThan(0);
    expect(registry.getByCategory('elevation').length).toBeGreaterThan(0);
    expect(registry.getByCategory('opacity').length).toBeGreaterThan(0);
  });
});
