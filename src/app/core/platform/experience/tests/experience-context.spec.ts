import { TestBed } from '@angular/core/testing';
import { ExperienceContext } from '../experience-context';
import { ExperienceState } from '../experience-state';
import { EXPERIENCE_INITIAL_STATE } from '../experience.tokens';

describe('ExperienceContext', () => {
  let ctx: ExperienceContext;
  let state: ExperienceState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EXPERIENCE_INITIAL_STATE, useValue: {} }],
    });
    ctx   = TestBed.inject(ExperienceContext);
    state = TestBed.inject(ExperienceState);
  });

  it('reflects default language', () => expect(ctx.languageCode()).toBe('en'));
  it('reflects default direction', () => expect(ctx.direction()).toBe('ltr'));

  it('isRtl() is false by default', () => expect(ctx.isRtl()).toBeFalse());

  it('isRtl() is true after switching to Arabic', () => {
    state.setLanguage('ar');
    expect(ctx.isRtl()).toBeTrue();
  });

  it('isLanguage() matches current language', () => {
    state.setLanguage('fr');
    expect(ctx.isLanguage('fr')).toBeTrue();
    expect(ctx.isLanguage('en')).toBeFalse();
  });

  it('isLocale() matches current locale', () => {
    state.setLocale('fr-FR');
    expect(ctx.isLocale('fr-FR')).toBeTrue();
  });

  it('snapshot() has consistent state and resolvedAt', () => {
    state.setTheme('dark');
    const snap = ctx.snapshot();
    expect(snap.state.themeId).toBe('dark');
    expect(snap.resolvedAt).toBeTruthy();
  });

  it('themeId signal tracks state changes', () => {
    state.setTheme('solarized');
    expect(ctx.themeId()).toBe('solarized');
  });

  it('densityId signal tracks state changes', () => {
    state.setDensity('spacious');
    expect(ctx.densityId()).toBe('spacious');
  });
});
