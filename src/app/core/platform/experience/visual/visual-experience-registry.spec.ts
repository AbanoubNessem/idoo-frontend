import { TestBed } from '@angular/core/testing';
import { VisualExperienceRegistryService } from './visual-experience-registry.service';
import {
  DEFAULT_TYPOGRAPHY_ID, DEFAULT_DENSITY_ID, DEFAULT_ICON_PACK_ID,
  DEFAULT_MOTION_ID, DEFAULT_ACCESSIBILITY_ID,
  BUILT_IN_TYPOGRAPHY_PROFILES, BUILT_IN_DENSITY_PROFILES,
  BUILT_IN_ICON_PACK_PROFILES, BUILT_IN_MOTION_PROFILES, BUILT_IN_ACCESSIBILITY_PROFILES,
} from './visual.constants';

describe('VisualExperienceRegistryService', () => {
  let service: VisualExperienceRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisualExperienceRegistryService);
  });

  // ─── Built-ins ────────────────────────────────────────────────────────────

  it('registers built-in typography profiles', () => {
    expect(service.allTypography().length).toBe(BUILT_IN_TYPOGRAPHY_PROFILES.length);
  });

  it('registers built-in density profiles', () => {
    expect(service.allDensity().length).toBe(BUILT_IN_DENSITY_PROFILES.length);
  });

  it('registers built-in icon pack profiles', () => {
    expect(service.allIconPacks().length).toBe(BUILT_IN_ICON_PACK_PROFILES.length);
  });

  it('registers built-in motion profiles', () => {
    expect(service.allMotion().length).toBe(BUILT_IN_MOTION_PROFILES.length);
  });

  it('registers built-in accessibility profiles', () => {
    expect(service.allAccessibility().length).toBe(BUILT_IN_ACCESSIBILITY_PROFILES.length);
  });

  // ─── Retrieval ────────────────────────────────────────────────────────────

  it('gets default typography', () => {
    expect(service.getTypography(DEFAULT_TYPOGRAPHY_ID)).toBeTruthy();
  });

  it('gets default density', () => {
    expect(service.getDensity(DEFAULT_DENSITY_ID)).toBeTruthy();
  });

  it('gets default icon pack', () => {
    expect(service.getIconPack(DEFAULT_ICON_PACK_ID)).toBeTruthy();
  });

  it('gets default motion', () => {
    expect(service.getMotion(DEFAULT_MOTION_ID)).toBeTruthy();
  });

  it('gets default accessibility', () => {
    expect(service.getAccessibility(DEFAULT_ACCESSIBILITY_ID)).toBeTruthy();
  });

  it('returns null for unknown id', () => {
    expect(service.getTypography('does-not-exist')).toBeNull();
  });

  // ─── Custom Registration ─────────────────────────────────────────────────

  it('registers custom typography profile', () => {
    service.registerTypography({
      id: 'custom-type',
      name: 'Custom',
      fontFamilyBase: "'Roboto', sans-serif",
      scale: { base: '14px' },
      weights: { normal: '400', medium: '500', bold: '700' },
      lineHeights: { tight: '1.25', normal: '1.5', relaxed: '1.75' },
    });
    expect(service.hasTypography('custom-type')).toBe(true);
    expect(service.getTypography('custom-type')?.name).toBe('Custom');
  });

  it('registers custom density profile', () => {
    service.registerDensity({
      id: 'custom-density',
      name: 'Custom Density',
      level: 'compact',
      heightSm: '20px', heightMd: '28px', heightLg: '36px',
      paddingXs: '2px', paddingSm: '4px', paddingMd: '6px', paddingLg: '8px',
      gapSm: '4px', gapMd: '6px', gapLg: '8px',
    });
    expect(service.hasDensity('custom-density')).toBe(true);
  });

  // ─── Counts ──────────────────────────────────────────────────────────────

  it('counts includes all dimensions', () => {
    const counts = service.counts();
    expect(counts['typography']).toBeGreaterThan(0);
    expect(counts['density']).toBeGreaterThan(0);
    expect(counts['icon-pack']).toBeGreaterThan(0);
    expect(counts['motion']).toBeGreaterThan(0);
    expect(counts['accessibility']).toBeGreaterThan(0);
  });
});
