import { TestBed } from '@angular/core/testing';
import { ExperienceState } from '../experience-state';
import { EXPERIENCE_INITIAL_STATE } from '../experience.tokens';

describe('ExperienceState', () => {
  let state: ExperienceState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EXPERIENCE_INITIAL_STATE, useValue: {} }],
    });
    state = TestBed.inject(ExperienceState);
  });

  it('has default language "en"', () => expect(state.languageCode()).toBe('en'));
  it('has default locale "en-US"', () => expect(state.localeCode()).toBe('en-US'));
  it('has default direction "ltr"', () => expect(state.direction()).toBe('ltr'));
  it('has default densityId "comfortable"', () => expect(state.densityId()).toBe('comfortable'));
  it('has null themeId by default', () => expect(state.themeId()).toBeNull());

  it('setLanguage to Arabic switches direction to rtl', () => {
    state.setLanguage('ar');
    expect(state.direction()).toBe('rtl');
  });

  it('setLanguage back to "en" restores ltr', () => {
    state.setLanguage('ar');
    state.setLanguage('en');
    expect(state.direction()).toBe('ltr');
  });

  it('setTheme updates themeId', () => {
    state.setTheme('dark');
    expect(state.themeId()).toBe('dark');
  });

  it('setDensity updates densityId', () => {
    state.setDensity('compact');
    expect(state.densityId()).toBe('compact');
  });

  it('setBranding updates brandingId', () => {
    state.setBranding('corp-brand');
    expect(state.brandingId()).toBe('corp-brand');
  });

  it('applySnapshot patches multiple fields', () => {
    state.applySnapshot({ languageCode: 'fr', localeCode: 'fr-FR', densityId: 'spacious' });
    expect(state.languageCode()).toBe('fr');
    expect(state.localeCode()).toBe('fr-FR');
    expect(state.densityId()).toBe('spacious');
  });

  it('reset returns to defaults', () => {
    state.setLanguage('ar');
    state.setTheme('dark');
    state.reset();
    expect(state.languageCode()).toBe('en');
    expect(state.themeId()).toBeNull();
    expect(state.direction()).toBe('ltr');
  });

  it('snapshot is a consistent read of all fields', () => {
    state.setTheme('light');
    state.setLanguage('he');
    const snap = state.snapshot();
    expect(snap.themeId).toBe('light');
    expect(snap.languageCode).toBe('he');
    expect(snap.direction).toBe('rtl');
  });
});

describe('ExperienceState with initial overrides', () => {
  it('respects EXPERIENCE_INITIAL_STATE token', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: EXPERIENCE_INITIAL_STATE, useValue: { languageCode: 'ar', localeCode: 'ar-SA' } },
      ],
    });
    const s = TestBed.inject(ExperienceState);
    expect(s.languageCode()).toBe('ar');
    expect(s.localeCode()).toBe('ar-SA');
    expect(s.direction()).toBe('rtl');
  });
});
