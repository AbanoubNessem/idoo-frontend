import { TestBed } from '@angular/core/testing';
import { ExperienceBuilderService } from '../experience-builder.service';

describe('ExperienceBuilderService', () => {
  let service: ExperienceBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExperienceBuilderService);
  });

  it('builds a minimal profile with id', () => {
    const p = service.create('prof-1').build();
    expect(p.id).toBe('prof-1');
  });

  it('sets theme', () => {
    const p = service.create('p').theme('dark').build();
    expect(p.themeId).toBe('dark');
  });

  it('sets language and locale', () => {
    const p = service.create('p').language('ar').locale('ar-SA').build();
    expect(p.languageCode).toBe('ar');
    expect(p.localeCode).toBe('ar-SA');
  });

  it('sets density, typography, iconPack, branding', () => {
    const p = service.create('p')
      .density('compact').typography('mono').iconPack('material').branding('corp')
      .build();
    expect(p.densityId).toBe('compact');
    expect(p.typographyId).toBe('mono');
    expect(p.iconPackId).toBe('material');
    expect(p.brandingId).toBe('corp');
  });

  it('sets name and version', () => {
    const p = service.create('p').name('My Profile').version('2.0').build();
    expect(p.name).toBe('My Profile');
    expect(p.version).toBe('2.0');
  });

  it('rtlArabic() helper sets ar/ar-SA', () => {
    const p = service.rtlArabic('arabic-prof').build();
    expect(p.languageCode).toBe('ar');
    expect(p.localeCode).toBe('ar-SA');
  });

  it('default() helper sets sensible defaults', () => {
    const p = service.default('def').build();
    expect(p.languageCode).toBe('en');
    expect(p.densityId).toBe('comfortable');
    expect(p.iconPackId).toBe('default');
  });

  it('build is immutable — calling build() twice gives equal results', () => {
    const b = service.create('x').theme('light').language('en');
    expect(b.build()).toEqual(b.build());
  });
});
