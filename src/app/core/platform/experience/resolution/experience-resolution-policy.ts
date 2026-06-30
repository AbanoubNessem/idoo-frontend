import { ThemeLayer } from '../theme/theme.types';

// ─── Strategy ─────────────────────────────────────────────────────────────────

export type ResolutionStrategy = 'merge' | 'replace' | 'merge-deep';

// ─── Policy ───────────────────────────────────────────────────────────────────

export interface ExperienceResolutionPolicy {
  readonly order:             ReadonlyArray<ThemeLayer>;
  readonly strategy:          ResolutionStrategy;
  readonly fallbackToDefault: boolean;
  readonly allowRuntimeOverride:      boolean;
  readonly allowAccessibilityOverride: boolean;
}

// ─── Built-in Policies ────────────────────────────────────────────────────────

export const DEFAULT_RESOLUTION_POLICY: ExperienceResolutionPolicy = {
  order: ['platform', 'tenant', 'company', 'user', 'runtime', 'accessibility'],
  strategy: 'merge',
  fallbackToDefault: true,
  allowRuntimeOverride: true,
  allowAccessibilityOverride: true,
};

export const REPLACE_RESOLUTION_POLICY: ExperienceResolutionPolicy = {
  ...DEFAULT_RESOLUTION_POLICY,
  strategy: 'replace',
};

export const STRICT_RESOLUTION_POLICY: ExperienceResolutionPolicy = {
  ...DEFAULT_RESOLUTION_POLICY,
  allowRuntimeOverride: false,
  allowAccessibilityOverride: false,
};

// ─── Builder ──────────────────────────────────────────────────────────────────

export class ResolutionPolicyBuilder {
  private _policy: ExperienceResolutionPolicy = { ...DEFAULT_RESOLUTION_POLICY };

  order(layers: ReadonlyArray<ThemeLayer>): this {
    this._policy = { ...this._policy, order: layers };
    return this;
  }

  strategy(s: ResolutionStrategy): this {
    this._policy = { ...this._policy, strategy: s };
    return this;
  }

  noFallback(): this {
    this._policy = { ...this._policy, fallbackToDefault: false };
    return this;
  }

  noRuntimeOverride(): this {
    this._policy = { ...this._policy, allowRuntimeOverride: false };
    return this;
  }

  noAccessibilityOverride(): this {
    this._policy = { ...this._policy, allowAccessibilityOverride: false };
    return this;
  }

  build(): ExperienceResolutionPolicy {
    return { ...this._policy };
  }
}
