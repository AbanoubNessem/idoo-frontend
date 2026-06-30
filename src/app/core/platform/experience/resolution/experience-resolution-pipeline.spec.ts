import { TestBed } from '@angular/core/testing';
import { ExperienceResolutionPipeline } from './experience-resolution-pipeline.service';
import { ExperienceResolutionContextBuilder } from './experience-resolution-context';
import {
  DEFAULT_RESOLUTION_POLICY,
  STRICT_RESOLUTION_POLICY,
  ResolutionPolicyBuilder,
} from './experience-resolution-policy';

describe('ExperienceResolutionPipeline', () => {
  let svc: ExperienceResolutionPipeline;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ExperienceResolutionPipeline);
  });

  it('is created', () => {
    expect(svc).toBeTruthy();
  });

  it('returns null effectiveThemeId when no layers are configured', () => {
    const ctx  = new ExperienceResolutionContextBuilder().build();
    const result = svc.resolve(ctx);
    expect(result.effectiveThemeId).toBeNull();
  });

  it('returns platform theme when only platform is configured', () => {
    const ctx = new ExperienceResolutionContextBuilder().platformTheme('platform-light').build();
    const result = svc.resolve(ctx);
    expect(result.effectiveThemeId).toBe('platform-light');
  });

  it('user theme wins over platform theme in merge mode', () => {
    const ctx = new ExperienceResolutionContextBuilder()
      .platformTheme('platform-light')
      .userTheme('platform-dark')
      .build();
    const result = svc.resolve(ctx, DEFAULT_RESOLUTION_POLICY);
    expect(result.effectiveThemeId).toBe('platform-dark');
  });

  it('accessibility override wins over user theme', () => {
    const ctx = new ExperienceResolutionContextBuilder()
      .userTheme('platform-dark')
      .accessibilityOverride('platform-high-contrast')
      .build();
    const result = svc.resolve(ctx);
    expect(result.effectiveThemeId).toBe('platform-high-contrast');
  });

  it('skips runtime override when policy disables it', () => {
    const ctx = new ExperienceResolutionContextBuilder()
      .platformTheme('platform-light')
      .runtimeOverride('special-theme')
      .build();
    const result = svc.resolve(ctx, STRICT_RESOLUTION_POLICY);
    const runtimeLayer = result.layerResults.find(r => r.layer === 'runtime');
    expect(runtimeLayer?.resolved).toBeFalse();
    expect(runtimeLayer?.reason).toBe('runtime-override-disabled');
    expect(result.effectiveThemeId).toBe('platform-light');
  });

  it('skips accessibility override when policy disables it', () => {
    const ctx = new ExperienceResolutionContextBuilder()
      .userTheme('platform-dark')
      .accessibilityOverride('platform-high-contrast')
      .build();
    const result = svc.resolve(ctx, STRICT_RESOLUTION_POLICY);
    const accessLayer = result.layerResults.find(r => r.layer === 'accessibility');
    expect(accessLayer?.resolved).toBeFalse();
    expect(result.effectiveThemeId).toBe('platform-dark');
  });

  it('records not-configured reason for empty layers', () => {
    const ctx = new ExperienceResolutionContextBuilder().platformTheme('platform-light').build();
    const result = svc.resolve(ctx);
    const userLayer = result.layerResults.find(r => r.layer === 'user');
    expect(userLayer?.reason).toBe('not-configured');
    expect(userLayer?.resolved).toBeFalse();
  });

  it('resolvedAt is a valid ISO date', () => {
    const ctx = new ExperienceResolutionContextBuilder().build();
    const result = svc.resolve(ctx);
    expect(new Date(result.resolvedAt).getTime()).not.toBeNaN();
  });

  it('includes all policy layers in results', () => {
    const ctx = new ExperienceResolutionContextBuilder().build();
    const result = svc.resolve(ctx, DEFAULT_RESOLUTION_POLICY);
    const layers = result.layerResults.map(r => r.layer);
    expect(layers).toContain('platform');
    expect(layers).toContain('tenant');
    expect(layers).toContain('user');
    expect(layers).toContain('runtime');
    expect(layers).toContain('accessibility');
  });

  it('respects custom order', () => {
    const policy = new ResolutionPolicyBuilder()
      .order(['user', 'platform'])
      .build();
    const ctx = new ExperienceResolutionContextBuilder()
      .platformTheme('platform-light')
      .userTheme('platform-dark')
      .build();
    const result = svc.resolve(ctx, policy);
    // platform is last, so it wins in merge mode
    expect(result.effectiveThemeId).toBe('platform-light');
  });

  it('getActivePolicy returns the injected policy', () => {
    expect(svc.getActivePolicy()).toBeTruthy();
    expect(svc.getActivePolicy().order.length).toBeGreaterThan(0);
  });
});
