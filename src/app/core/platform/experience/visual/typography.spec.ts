import {
  TYPOGRAPHY_DEFAULT, TYPOGRAPHY_ARABIC, TYPOGRAPHY_LARGE,
  BUILT_IN_TYPOGRAPHY_PROFILES,
} from './visual.constants';

describe('Built-in Typography Profiles', () => {
  it('all built-in profiles have unique ids', () => {
    const ids = BUILT_IN_TYPOGRAPHY_PROFILES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe('TYPOGRAPHY_DEFAULT', () => {
    it('has required scale.base', () => {
      expect(TYPOGRAPHY_DEFAULT.scale.base).toBeTruthy();
    });

    it('has required weights', () => {
      expect(TYPOGRAPHY_DEFAULT.weights.normal).toBeTruthy();
      expect(TYPOGRAPHY_DEFAULT.weights.bold).toBeTruthy();
    });

    it('has required lineHeights', () => {
      expect(TYPOGRAPHY_DEFAULT.lineHeights.tight).toBeTruthy();
      expect(TYPOGRAPHY_DEFAULT.lineHeights.normal).toBeTruthy();
      expect(TYPOGRAPHY_DEFAULT.lineHeights.relaxed).toBeTruthy();
    });

    it('has no Arabic font family', () => {
      // Default profile is Latin-only
      expect(TYPOGRAPHY_DEFAULT.fontFamilyArabic).toBeUndefined();
    });
  });

  describe('TYPOGRAPHY_ARABIC', () => {
    it('has Arabic font family', () => {
      expect(TYPOGRAPHY_ARABIC.fontFamilyArabic).toBeTruthy();
    });

    it('has larger base size than default', () => {
      const arabicBase  = parseInt(TYPOGRAPHY_ARABIC.scale.base, 10);
      const defaultBase = parseInt(TYPOGRAPHY_DEFAULT.scale.base, 10);
      expect(arabicBase).toBeGreaterThan(defaultBase);
    });
  });

  describe('TYPOGRAPHY_LARGE', () => {
    it('has base size ≥ 16px for accessibility', () => {
      const base = parseInt(TYPOGRAPHY_LARGE.scale.base, 10);
      expect(base).toBeGreaterThanOrEqual(16);
    });

    it('has relaxed line height for readability', () => {
      const relaxed = parseFloat(TYPOGRAPHY_LARGE.lineHeights.relaxed);
      expect(relaxed).toBeGreaterThan(1.5);
    });
  });
});
