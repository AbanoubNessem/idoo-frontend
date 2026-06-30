import {
  DEFAULT_RESOLUTION_POLICY,
  REPLACE_RESOLUTION_POLICY,
  STRICT_RESOLUTION_POLICY,
  ResolutionPolicyBuilder,
} from './experience-resolution-policy';

describe('Experience Resolution Policy', () => {
  // ─── Built-in Policies ────────────────────────────────────────────────────

  describe('DEFAULT_RESOLUTION_POLICY', () => {
    it('uses merge strategy', () => {
      expect(DEFAULT_RESOLUTION_POLICY.strategy).toBe('merge');
    });

    it('allows runtime and accessibility overrides', () => {
      expect(DEFAULT_RESOLUTION_POLICY.allowRuntimeOverride).toBeTrue();
      expect(DEFAULT_RESOLUTION_POLICY.allowAccessibilityOverride).toBeTrue();
    });

    it('has fallbackToDefault=true', () => {
      expect(DEFAULT_RESOLUTION_POLICY.fallbackToDefault).toBeTrue();
    });

    it('orders platform before tenant before user', () => {
      const order = DEFAULT_RESOLUTION_POLICY.order;
      expect(order.indexOf('platform')).toBeLessThan(order.indexOf('tenant'));
      expect(order.indexOf('tenant')).toBeLessThan(order.indexOf('user'));
    });

    it('orders user before runtime and runtime before accessibility', () => {
      const order = DEFAULT_RESOLUTION_POLICY.order;
      expect(order.indexOf('user')).toBeLessThan(order.indexOf('runtime'));
      expect(order.indexOf('runtime')).toBeLessThan(order.indexOf('accessibility'));
    });
  });

  describe('REPLACE_RESOLUTION_POLICY', () => {
    it('uses replace strategy', () => {
      expect(REPLACE_RESOLUTION_POLICY.strategy).toBe('replace');
    });
  });

  describe('STRICT_RESOLUTION_POLICY', () => {
    it('disallows runtime and accessibility overrides', () => {
      expect(STRICT_RESOLUTION_POLICY.allowRuntimeOverride).toBeFalse();
      expect(STRICT_RESOLUTION_POLICY.allowAccessibilityOverride).toBeFalse();
    });
  });

  // ─── Builder ──────────────────────────────────────────────────────────────

  describe('ResolutionPolicyBuilder', () => {
    it('builds a policy with defaults', () => {
      const policy = new ResolutionPolicyBuilder().build();
      expect(policy).toEqual(DEFAULT_RESOLUTION_POLICY);
    });

    it('sets strategy via .strategy()', () => {
      const policy = new ResolutionPolicyBuilder().strategy('replace').build();
      expect(policy.strategy).toBe('replace');
    });

    it('sets custom order via .order()', () => {
      const policy = new ResolutionPolicyBuilder()
        .order(['platform', 'user'])
        .build();
      expect(policy.order).toEqual(['platform', 'user']);
    });

    it('disables fallback via .noFallback()', () => {
      const policy = new ResolutionPolicyBuilder().noFallback().build();
      expect(policy.fallbackToDefault).toBeFalse();
    });

    it('disables runtime override via .noRuntimeOverride()', () => {
      const policy = new ResolutionPolicyBuilder().noRuntimeOverride().build();
      expect(policy.allowRuntimeOverride).toBeFalse();
    });

    it('disables accessibility override via .noAccessibilityOverride()', () => {
      const policy = new ResolutionPolicyBuilder().noAccessibilityOverride().build();
      expect(policy.allowAccessibilityOverride).toBeFalse();
    });

    it('supports method chaining', () => {
      const policy = new ResolutionPolicyBuilder()
        .strategy('replace')
        .noRuntimeOverride()
        .noFallback()
        .build();
      expect(policy.strategy).toBe('replace');
      expect(policy.allowRuntimeOverride).toBeFalse();
      expect(policy.fallbackToDefault).toBeFalse();
    });

    it('does not mutate internal state between .build() calls', () => {
      const builder = new ResolutionPolicyBuilder();
      const p1 = builder.build();
      const p2 = builder.noRuntimeOverride().build();
      expect(p1.allowRuntimeOverride).toBeTrue();
      expect(p2.allowRuntimeOverride).toBeFalse();
    });
  });
});
