import { TestBed } from '@angular/core/testing';
import { CultureResolverService } from './culture-resolver.service';
import { CULTURE_BROWSER_DETECTION } from './culture.tokens';
import { CultureResolutionInput } from './culture.tokens';

describe('CultureResolverService', () => {
  let svc: CultureResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: CULTURE_BROWSER_DETECTION, useValue: false }],
    });
    svc = TestBed.inject(CultureResolverService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('resolve() returns null effectiveCode when no layers configured', () => {
    const input: CultureResolutionInput = { codeByLayer: {} };
    const result = svc.resolve(input);
    expect(result.effectiveCode).toBeNull();
  });

  it('platform layer wins when no higher layer configured', () => {
    const input: CultureResolutionInput = { codeByLayer: { platform: 'en-US' } };
    const result = svc.resolve(input);
    expect(result.effectiveCode).toBe('en-US');
  });

  it('user layer wins over platform', () => {
    const input: CultureResolutionInput = {
      codeByLayer: { platform: 'en-US', user: 'ar-SA' },
    };
    const result = svc.resolve(input);
    expect(result.effectiveCode).toBe('ar-SA');
  });

  it('runtime layer wins over user', () => {
    const input: CultureResolutionInput = {
      codeByLayer: { platform: 'en-US', user: 'ar-SA', runtime: 'de-DE' },
    };
    const result = svc.resolve(input);
    expect(result.effectiveCode).toBe('de-DE');
  });

  it('marks unknown culture as not-registered', () => {
    const input: CultureResolutionInput = { codeByLayer: { platform: 'xx-XX' } };
    const result = svc.resolve(input);
    const snap = result.layerSnapshots.find(s => s.layer === 'platform');
    expect(snap?.applied).toBeFalse();
    expect(snap?.reason).toBe('not-registered');
  });

  it('marks unconfigured layers as not-configured', () => {
    const input: CultureResolutionInput = { codeByLayer: { platform: 'en-US' } };
    const result = svc.resolve(input);
    const userSnap = result.layerSnapshots.find(s => s.layer === 'user');
    expect(userSnap?.reason).toBe('not-configured');
  });

  it('resolveEffective() returns a full EffectiveCulture', () => {
    const input: CultureResolutionInput = { codeByLayer: { platform: 'en-US' } };
    const eff = svc.resolveEffective(input);
    expect(eff.code).toBe('en-US');
    expect(eff.language).toBe('en');
    expect(eff.direction).toBe('ltr');
    expect(eff.resolvedAt).toBeTruthy();
  });

  it('resolveEffective() falls back to en-US when no layer resolves', () => {
    const input: CultureResolutionInput = { codeByLayer: {} };
    const eff = svc.resolveEffective(input);
    expect(eff.code).toBe('en-US');
  });

  it('detectBrowser() returns null when browser detection is disabled', () => {
    expect(svc.detectBrowser()).toBeNull();
  });

  it('resolvedAt is a valid ISO date', () => {
    const result = svc.resolve({ codeByLayer: {} });
    expect(new Date(result.resolvedAt).getTime()).not.toBeNaN();
  });
});
