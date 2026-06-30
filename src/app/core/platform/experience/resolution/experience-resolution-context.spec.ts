import { ExperienceResolutionContextBuilder } from './experience-resolution-context';

describe('ExperienceResolutionContextBuilder', () => {
  it('builds an empty context', () => {
    const ctx = new ExperienceResolutionContextBuilder().build();
    expect(ctx.themeByLayer).toEqual({});
    expect(ctx.tenantId).toBeUndefined();
    expect(ctx.companyId).toBeUndefined();
    expect(ctx.userId).toBeUndefined();
  });

  it('sets tenantId', () => {
    const ctx = new ExperienceResolutionContextBuilder().forTenant('t1').build();
    expect(ctx.tenantId).toBe('t1');
  });

  it('sets companyId', () => {
    const ctx = new ExperienceResolutionContextBuilder().forCompany('c1').build();
    expect(ctx.companyId).toBe('c1');
  });

  it('sets userId', () => {
    const ctx = new ExperienceResolutionContextBuilder().forUser('u1').build();
    expect(ctx.userId).toBe('u1');
  });

  it('sets platformTheme', () => {
    const ctx = new ExperienceResolutionContextBuilder().platformTheme('light').build();
    expect(ctx.themeByLayer['platform']).toBe('light');
  });

  it('sets tenantTheme', () => {
    const ctx = new ExperienceResolutionContextBuilder().tenantTheme('brand').build();
    expect(ctx.themeByLayer['tenant']).toBe('brand');
  });

  it('sets userTheme', () => {
    const ctx = new ExperienceResolutionContextBuilder().userTheme('dark').build();
    expect(ctx.themeByLayer['user']).toBe('dark');
  });

  it('sets runtimeOverride', () => {
    const ctx = new ExperienceResolutionContextBuilder().runtimeOverride('ab-dark').build();
    expect(ctx.themeByLayer['runtime']).toBe('ab-dark');
  });

  it('sets accessibilityOverride', () => {
    const ctx = new ExperienceResolutionContextBuilder().accessibilityOverride('high-contrast').build();
    expect(ctx.themeByLayer['accessibility']).toBe('high-contrast');
  });

  it('supports chaining multiple layers', () => {
    const ctx = new ExperienceResolutionContextBuilder()
      .forTenant('t1')
      .forCompany('c1')
      .forUser('u1')
      .platformTheme('platform-light')
      .tenantTheme('brand-blue')
      .userTheme('dark')
      .runtimeOverride('abt-theme')
      .build();

    expect(ctx.tenantId).toBe('t1');
    expect(ctx.companyId).toBe('c1');
    expect(ctx.userId).toBe('u1');
    expect(ctx.themeByLayer['platform']).toBe('platform-light');
    expect(ctx.themeByLayer['tenant']).toBe('brand-blue');
    expect(ctx.themeByLayer['user']).toBe('dark');
    expect(ctx.themeByLayer['runtime']).toBe('abt-theme');
  });

  it('does not mutate earlier builds on subsequent calls', () => {
    const builder = new ExperienceResolutionContextBuilder().platformTheme('light');
    const ctx1 = builder.build();
    const ctx2 = builder.tenantTheme('dark').build();
    expect(ctx1.themeByLayer['tenant']).toBeUndefined();
    expect(ctx2.themeByLayer['tenant']).toBe('dark');
  });
});
