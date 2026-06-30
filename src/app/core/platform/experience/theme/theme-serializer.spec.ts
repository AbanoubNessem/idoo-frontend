import { TestBed } from '@angular/core/testing';
import { ThemeSerializerService } from './theme-serializer.service';
import { PLATFORM_LIGHT_THEME }   from './theme.constants';
import { ThemeDefinition }        from './theme.types';

describe('ThemeSerializerService', () => {
  let svc: ThemeSerializerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ThemeSerializerService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('serializes a theme to a JSON string', () => {
    const json = svc.serialize(PLATFORM_LIGHT_THEME);
    expect(typeof json).toBe('string');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes schemaVersion in envelope', () => {
    const json = svc.serialize(PLATFORM_LIGHT_THEME);
    const env  = JSON.parse(json);
    expect(env.schemaVersion).toBeDefined();
  });

  it('round-trips a theme through serialize/deserialize', () => {
    const json        = svc.serialize(PLATFORM_LIGHT_THEME);
    const deserialized = svc.deserialize(json);
    expect(deserialized.id).toBe(PLATFORM_LIGHT_THEME.id);
    expect(deserialized.variant).toBe(PLATFORM_LIGHT_THEME.variant);
  });

  it('deserializes a bare theme object (no envelope)', () => {
    const json        = JSON.stringify(PLATFORM_LIGHT_THEME);
    const deserialized = svc.deserialize(json);
    expect(deserialized.id).toBe(PLATFORM_LIGHT_THEME.id);
  });

  it('throws on invalid JSON', () => {
    expect(() => svc.deserialize('not-json')).toThrowError(/Invalid JSON/);
  });

  it('throws when JSON has neither envelope.theme nor id+tokens', () => {
    expect(() => svc.deserialize('"just-a-string"')).toThrowError(/valid theme/);
  });

  it('serializeTokens produces a flat map', () => {
    const flat = svc.serializeTokens(PLATFORM_LIGHT_THEME);
    expect(flat['color.primary']).toBeDefined();
    expect(flat['spacing.4']).toBeDefined();
    expect(flat['radius.md']).toBeDefined();
    expect(flat['elevation.md']).toBeDefined();
  });

  it('clone produces a deep copy', () => {
    const cloned = svc.clone(PLATFORM_LIGHT_THEME);
    expect(cloned).not.toBe(PLATFORM_LIGHT_THEME);
    expect(cloned.id).toBe(PLATFORM_LIGHT_THEME.id);
    expect((cloned.tokens.colors as Record<string, string>)['primary']).toBe(
      (PLATFORM_LIGHT_THEME.tokens.colors as Record<string, string>)['primary'],
    );
  });
});
