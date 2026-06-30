import { TestBed } from '@angular/core/testing';
import { ExperienceEngineService } from '../experience-engine.service';
import { ExperienceState } from '../experience-state';
import { EXPERIENCE_INITIAL_STATE, EXPERIENCE_DEFAULT_PROFILE } from '../experience.tokens';
import { ThemeProfileStub, LanguageProfileStub, ExperienceProfile } from '../experience.types';

const themeLight: ThemeProfileStub = { id: 'light', name: 'Light', kind: 'theme' };
const themeDark:  ThemeProfileStub = { id: 'dark',  name: 'Dark',  kind: 'theme' };
const langEn: LanguageProfileStub  = {
  id: 'en', name: 'English', kind: 'language',
  code: 'en', nativeName: 'English', direction: 'ltr',
};
const langAr: LanguageProfileStub  = {
  id: 'ar', name: 'Arabic',  kind: 'language',
  code: 'ar', nativeName: 'العربية', direction: 'rtl',
};

function makeEngine(): ExperienceEngineService {
  return TestBed.inject(ExperienceEngineService);
}

describe('ExperienceEngineService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: EXPERIENCE_INITIAL_STATE, useValue: {} },
        { provide: EXPERIENCE_DEFAULT_PROFILE, useValue: null },
      ],
    });
  });

  it('starts in ready phase after init', () => {
    expect(makeEngine().phase).toBe('ready');
  });

  it('register() + has() works for theme', () => {
    const engine = makeEngine();
    engine.register('theme', themeLight);
    expect(engine.has('theme', 'light')).toBeTrue();
  });

  it('getProfile() retrieves registered profile', () => {
    const engine = makeEngine();
    engine.register('theme', themeDark);
    expect(engine.getProfile('theme', 'dark')).toEqual(themeDark);
  });

  it('allProfiles() returns all registered profiles for dimension', () => {
    const engine = makeEngine();
    engine.register('theme', themeLight);
    engine.register('theme', themeDark);
    expect(engine.allProfiles('theme').length).toBeGreaterThanOrEqual(2);
  });

  it('setTheme() updates state', () => {
    const engine = makeEngine();
    engine.setTheme('dark');
    expect(engine.themeId()).toBe('dark');
  });

  it('setLanguage("ar") updates direction to rtl', () => {
    const engine = makeEngine();
    engine.setLanguage('ar');
    expect(engine.direction()).toBe('rtl');
  });

  it('setLanguage("en") keeps direction ltr', () => {
    const engine = makeEngine();
    engine.setLanguage('en');
    expect(engine.direction()).toBe('ltr');
  });

  it('setDensity() updates densityId', () => {
    const engine = makeEngine();
    engine.setDensity('compact');
    expect(engine.densityId()).toBe('compact');
  });

  it('apply() sets multiple fields from profile', () => {
    const engine = makeEngine();
    const profile: ExperienceProfile = {
      id: 'p', name: 'Test', themeId: 'dark', languageCode: 'ar',
      localeCode: 'ar-SA', densityId: 'compact',
    };
    engine.apply(profile);
    expect(engine.themeId()).toBe('dark');
    expect(engine.languageCode()).toBe('ar');
    expect(engine.direction()).toBe('rtl');
    expect(engine.densityId()).toBe('compact');
  });

  it('apply() emits experience:applied event', (done) => {
    const engine = makeEngine();
    engine.events.on('experience:applied').subscribe(() => done());
    engine.apply({ id: 'p', name: 'P', themeId: 'light' });
  });

  it('reset() restores defaults', () => {
    const engine = makeEngine();
    engine.setLanguage('ar');
    engine.setTheme('dark');
    engine.reset();
    expect(engine.languageCode()).toBe('en');
    expect(engine.themeId()).toBeNull();
    expect(engine.direction()).toBe('ltr');
  });

  it('serialize/deserialize round-trips', () => {
    const engine = makeEngine();
    const profile: ExperienceProfile = { id: 'rt', name: 'Round-trip', themeId: 'dark' };
    const json = engine.serialize(profile);
    const result = engine.deserialize(json);
    expect(result.id).toBe('rt');
    expect(result.themeId).toBe('dark');
  });

  it('exportCurrentState() produces valid JSON', () => {
    const engine = makeEngine();
    engine.setTheme('light');
    const json = engine.exportCurrentState();
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('setTheme() emits theme:changed event', (done) => {
    const engine = makeEngine();
    engine.events.on('theme:changed').subscribe(e => {
      expect(e.payload).toBe('solarized');
      done();
    });
    engine.setTheme('solarized');
  });
});

describe('ExperienceEngineService with default profile', () => {
  it('applies default profile on init', () => {
    const defaultProfile: ExperienceProfile = {
      id: 'default', name: 'Default', themeId: 'light', languageCode: 'en',
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: EXPERIENCE_INITIAL_STATE, useValue: {} },
        { provide: EXPERIENCE_DEFAULT_PROFILE, useValue: defaultProfile },
      ],
    });
    const engine = TestBed.inject(ExperienceEngineService);
    expect(engine.themeId()).toBe('light');
  });
});
