import { TestBed } from '@angular/core/testing';
import { ThemeValidatorService } from './theme-validator.service';
import { ThemeDefinition }       from './theme.types';
import { PLATFORM_LIGHT_THEME }  from './theme.constants';

describe('ThemeValidatorService', () => {
  let svc: ThemeValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ThemeValidatorService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('validates a built-in theme as valid', () => {
    const result = svc.validate(PLATFORM_LIGHT_THEME);
    expect(result.valid).toBeTrue();
    expect(result.errors).toEqual([]);
  });

  it('reports error for missing id', () => {
    const bad = { ...PLATFORM_LIGHT_THEME, id: '' };
    const result = svc.validate(bad as ThemeDefinition);
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.includes('id'))).toBeTrue();
  });

  it('reports error for missing name', () => {
    const bad = { ...PLATFORM_LIGHT_THEME, name: '' };
    const result = svc.validate(bad as ThemeDefinition);
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.includes('name'))).toBeTrue();
  });

  it('reports error for wrong kind', () => {
    const bad = { ...PLATFORM_LIGHT_THEME, kind: 'language' as 'theme' };
    const result = svc.validate(bad as unknown as ThemeDefinition);
    expect(result.valid).toBeFalse();
  });

  it('reports error for missing variant', () => {
    const bad = { ...PLATFORM_LIGHT_THEME, variant: undefined as unknown as 'light' };
    const result = svc.validate(bad);
    expect(result.valid).toBeFalse();
  });

  it('reports error for missing tokens', () => {
    const bad = { ...PLATFORM_LIGHT_THEME, tokens: undefined as unknown as ThemeDefinition['tokens'] };
    const result = svc.validate(bad);
    expect(result.valid).toBeFalse();
  });

  it('reports error for missing required color tokens', () => {
    const bad: ThemeDefinition = {
      ...PLATFORM_LIGHT_THEME,
      tokens: { colors: {} },
    };
    const result = svc.validate(bad);
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.includes('primary'))).toBeTrue();
  });

  it('warns on suspicious CSS values', () => {
    const suspicious: ThemeDefinition = {
      ...PLATFORM_LIGHT_THEME,
      tokens: {
        ...PLATFORM_LIGHT_THEME.tokens,
        spacing: { '1': 'INVALID_VALUE_!!' },
      },
    };
    const result = svc.validate(suspicious);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('isValid returns true for a valid theme', () => {
    expect(svc.isValid(PLATFORM_LIGHT_THEME)).toBeTrue();
  });

  it('isValid returns false for invalid theme', () => {
    const bad = { ...PLATFORM_LIGHT_THEME, id: '' };
    expect(svc.isValid(bad as ThemeDefinition)).toBeFalse();
  });
});
