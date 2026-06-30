import { TestBed } from '@angular/core/testing';
import { VisualExperienceResolverService } from './visual-experience-resolver.service';
import { EXPERIENCE_INITIAL_STATE }        from '../experience.tokens';
import {
  DEFAULT_TYPOGRAPHY_ID, DEFAULT_DENSITY_ID, DEFAULT_ICON_PACK_ID,
  DEFAULT_MOTION_ID, DEFAULT_ACCESSIBILITY_ID,
} from './visual.constants';

describe('VisualExperienceResolverService', () => {
  let service: VisualExperienceResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EXPERIENCE_INITIAL_STATE, useValue: {} }],
    });
    service = TestBed.inject(VisualExperienceResolverService);
  });

  it('resolves defaults when input is empty', () => {
    const result = service.resolve({});
    expect(result.typography.id).toBe(DEFAULT_TYPOGRAPHY_ID);
    expect(result.density.id).toBe(DEFAULT_DENSITY_ID);
    expect(result.iconPack.id).toBe(DEFAULT_ICON_PACK_ID);
    expect(result.motion.id).toBe(DEFAULT_MOTION_ID);
    expect(result.accessibility.id).toBe(DEFAULT_ACCESSIBILITY_ID);
  });

  it('later layer overrides earlier layer', () => {
    const result = service.resolve({
      typographyByLayer: {
        platform: DEFAULT_TYPOGRAPHY_ID,
        user:     'typography-arabic',
      },
    });
    expect(result.typography.id).toBe('typography-arabic');
  });

  it('runtime layer overrides all others', () => {
    const result = service.resolve({
      densityByLayer: {
        platform: 'density-compact',
        user:     'density-comfortable',
        runtime:  'density-spacious',
      },
    });
    expect(result.density.id).toBe('density-spacious');
  });

  it('accessibility layer is applied before runtime', () => {
    const result = service.resolve({
      motionByLayer: {
        user:          DEFAULT_MOTION_ID,
        accessibility: 'motion-reduced',
      },
    });
    expect(result.motion.id).toBe('motion-reduced');
  });

  it('returns resolvedAt as ISO string', () => {
    const result = service.resolve({});
    expect(result.resolvedAt).toBeTruthy();
    expect(() => new Date(result.resolvedAt)).not.toThrow();
  });

  it('builds correct layer snapshots', () => {
    const result = service.resolve({
      iconPackByLayer: { platform: DEFAULT_ICON_PACK_ID, user: 'heroicons' },
    });
    const layers = result.layers.iconPack;
    const user   = layers.find(l => l.layer === 'user');
    expect(user?.id).toBe('heroicons');
    expect(user?.applied).toBe(true);
  });

  it('resolveFromState uses current state', () => {
    const result = service.resolveFromState();
    expect(result.typography).toBeTruthy();
    expect(result.density).toBeTruthy();
    expect(result.motion).toBeTruthy();
  });

  it('falls back to default profile when unknown id supplied', () => {
    const result = service.resolve({
      typographyByLayer: { runtime: 'non-existent-id' },
    });
    expect(result.typography.id).toBe(DEFAULT_TYPOGRAPHY_ID);
  });
});
