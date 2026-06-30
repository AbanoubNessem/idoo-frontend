import { TestBed } from '@angular/core/testing';
import { ExperienceEngineService } from '../experience-engine.service';
import { ExperienceContext } from '../experience-context';
import { EXPERIENCE_INITIAL_STATE, EXPERIENCE_DEFAULT_PROFILE } from '../experience.tokens';
import { ThemeProfileStub, LanguageProfileStub } from '../experience.types';

describe('Experience Core — Integration', () => {
  let engine: ExperienceEngineService;
  let ctx: ExperienceContext;

  const providers = [
    { provide: EXPERIENCE_INITIAL_STATE, useValue: {} },
    { provide: EXPERIENCE_DEFAULT_PROFILE, useValue: null },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers });
    engine = TestBed.inject(ExperienceEngineService);
    ctx    = TestBed.inject(ExperienceContext);
  });

  it('full lifecycle: init → register → apply → reset', () => {
    const theme: ThemeProfileStub = { id: 'brand', name: 'Brand Theme', kind: 'theme' };
    engine.register('theme', theme);

    engine.apply({ id: 'corp', name: 'Corp', themeId: 'brand', languageCode: 'en' });
    expect(ctx.themeId()).toBe('brand');
    expect(ctx.direction()).toBe('ltr');

    engine.reset();
    expect(ctx.themeId()).toBeNull();
  });

  it('context reflects RTL after language change', () => {
    engine.setLanguage('ar');
    expect(ctx.isRtl()).toBeTrue();
    expect(ctx.direction()).toBe('rtl');

    engine.setLanguage('en');
    expect(ctx.isRtl()).toBeFalse();
  });

  it('events fire for each dimension change', () => {
    const fired: string[] = [];
    engine.events.events$.subscribe(e => fired.push(e.type));

    engine.setTheme('dark');
    engine.setLanguage('fr');
    engine.setDensity('spacious');

    expect(fired).toContain('theme:changed');
    expect(fired).toContain('language:changed');
    expect(fired).toContain('density:changed');
  });

  it('diagnostics report includes current state', () => {
    engine.setTheme('light');
    const report = engine.diagnosticsReport();
    expect(report.currentState.themeId).toBe('light');
    expect(report.phase).toBe('ready');
  });

  it('multiple sequential applies are stable', () => {
    for (let i = 0; i < 10; i++) {
      engine.apply({ id: 'p', name: 'P', themeId: i % 2 === 0 ? 'light' : 'dark' });
    }
    expect(engine.themeId()).toBe('light'); // last apply: i=8 (even)
  });

  it('builder integration: build and apply', () => {
    const profile = engine.builder
      .create('rtl-exp')
      .language('ar')
      .locale('ar-EG')
      .theme('dark')
      .build();

    engine.apply(profile);
    expect(engine.languageCode()).toBe('ar');
    expect(engine.direction()).toBe('rtl');
    expect(engine.themeId()).toBe('dark');
  });
});
