import { TestBed } from '@angular/core/testing';
import { ExperienceSerializerService } from '../experience-serializer.service';
import { ExperienceProfile } from '../experience.types';

const profile: ExperienceProfile = {
  id: 'p1', name: 'Test', languageCode: 'en', localeCode: 'en-US',
  themeId: 'dark', densityId: 'compact',
};

describe('ExperienceSerializerService', () => {
  let service: ExperienceSerializerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExperienceSerializerService);
  });

  it('serializes to valid JSON', () => {
    expect(() => JSON.parse(service.serialize(profile))).not.toThrow();
  });

  it('deserialized profile equals original', () => {
    const result = service.deserialize(service.serialize(profile));
    expect(result.id).toBe('p1');
    expect(result.themeId).toBe('dark');
    expect(result.densityId).toBe('compact');
  });

  it('throws on invalid JSON', () => {
    expect(() => service.deserialize('{ bad')).toThrow();
  });

  it('throws on wrong schema', () => {
    expect(() => service.deserialize(JSON.stringify({ data: 'x' }))).toThrow();
  });

  it('clone produces new id', () => {
    const cloned = service.clone(profile, 'cloned-id');
    expect(cloned.id).toBe('cloned-id');
    expect(cloned.themeId).toBe('dark');
  });

  it('serialized JSON contains schema version "1.0"', () => {
    expect(service.serialize(profile)).toContain('"1.0"');
  });
});
