import {
  DENSITY_COMPACT, DENSITY_COMFORTABLE, DENSITY_SPACIOUS,
  BUILT_IN_DENSITY_PROFILES,
} from './visual.constants';

describe('Built-in Density Profiles', () => {
  it('all built-in profiles have unique ids', () => {
    const ids = BUILT_IN_DENSITY_PROFILES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('density levels are distinct', () => {
    expect(DENSITY_COMPACT.level).toBe('compact');
    expect(DENSITY_COMFORTABLE.level).toBe('comfortable');
    expect(DENSITY_SPACIOUS.level).toBe('spacious');
  });

  it('compact has smaller heights than comfortable', () => {
    const compactMd     = parseInt(DENSITY_COMPACT.heightMd, 10);
    const comfortableMd = parseInt(DENSITY_COMFORTABLE.heightMd, 10);
    expect(compactMd).toBeLessThan(comfortableMd);
  });

  it('spacious has larger heights than comfortable', () => {
    const spaciousMd    = parseInt(DENSITY_SPACIOUS.heightMd, 10);
    const comfortableMd = parseInt(DENSITY_COMFORTABLE.heightMd, 10);
    expect(spaciousMd).toBeGreaterThan(comfortableMd);
  });

  it('compact has smaller padding than comfortable', () => {
    const compactPad     = parseInt(DENSITY_COMPACT.paddingMd, 10);
    const comfortablePad = parseInt(DENSITY_COMFORTABLE.paddingMd, 10);
    expect(compactPad).toBeLessThan(comfortablePad);
  });

  it('all profiles have px units on heights', () => {
    for (const p of BUILT_IN_DENSITY_PROFILES) {
      expect(p.heightMd).toMatch(/px$/);
      expect(p.paddingMd).toMatch(/px$/);
      expect(p.gapMd).toMatch(/px$/);
    }
  });

  it('comfortable density has built-in and default tags', () => {
    expect(DENSITY_COMFORTABLE.tags).toContain('built-in');
    expect(DENSITY_COMFORTABLE.tags).toContain('default');
  });
});
