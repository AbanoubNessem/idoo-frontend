import { TestBed } from '@angular/core/testing';
import { ComponentTokensService } from '../tokens/component-tokens.service';
import { ComponentTokenSet } from '../component.types';

describe('ComponentTokensService', () => {
  let service: ComponentTokensService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentTokensService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide global tokens', () => {
    expect(service.globalTokens['component.border-width']).toBe('1px');
    expect(service.globalTokens['component.focus-ring-width']).toBe('2px');
  });

  it('should register a token set', () => {
    const tokenSet: ComponentTokenSet = {
      componentKey: 'text-field',
      tokens: { 'text-field.min-height': '56px' },
    };
    service.registerTokenSet(tokenSet);
    expect(service.tokenSetCount()).toBe(1);
    expect(service.getTokenSet('text-field')).toBeTruthy();
  });

  it('should resolve tokens merging global + component tokens', () => {
    service.registerTokenSet({
      componentKey: 'my-field',
      tokens: { 'my-field.custom': '#abc' },
    });
    const resolved = service.resolve('my-field');
    expect(resolved['component.border-width']).toBe('1px');
    expect(resolved['my-field.custom']).toBe('#abc');
  });

  it('should return global tokens for unregistered component', () => {
    const resolved = service.resolve('unknown-key');
    expect(resolved['component.focus-ring-offset']).toBe('2px');
  });

  it('should apply density overrides in resolve()', () => {
    service.registerTokenSet({
      componentKey: 'dense-field',
      tokens: { 'dense-field.height': '56px' },
      densityOverrides: {
        compact: { 'dense-field.height': '40px' },
      },
    });
    const compact = service.resolve('dense-field', 'compact');
    expect(compact['dense-field.height']).toBe('40px');
    const normal = service.resolve('dense-field', 'comfortable');
    expect(normal['dense-field.height']).toBe('56px');
  });

  it('should convert token map to CSS style string', () => {
    const style = service.toCssStyle({ 'component.border-width': '2px' });
    expect(style).toContain('--component-border-width: 2px;');
  });

  it('should replace dots with dashes in CSS var names', () => {
    const style = service.toCssStyle({ 'a.b.c': 'value' });
    expect(style).toContain('--a-b-c: value;');
  });

  it('should return a density multiplier', () => {
    const m = service.getDensityMultiplier();
    expect(typeof m).toBe('number');
    expect(m).toBeGreaterThan(0);
  });

  it('should scale a pixel value', () => {
    const scaled = service.scale(16);
    expect(scaled).toMatch(/^\d+(\.\d+)?px$/);
  });

  it('should update token count signal after registration', () => {
    expect(service.tokenSetCount()).toBe(0);
    service.registerTokenSet({ componentKey: 'a', tokens: {} });
    service.registerTokenSet({ componentKey: 'b', tokens: {} });
    expect(service.tokenSetCount()).toBe(2);
  });
});
