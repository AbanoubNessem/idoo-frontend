import { Signal } from '@angular/core';
import { ComponentCategory, ComponentDensity, PlatformComponentMeta, ValidationResult } from '../component.types';

/**
 * Base contract for all platform components.
 * Every component in the platform component library must satisfy this interface.
 */
export interface PlatformComponent {
  /** Unique key identifying this component type in the registry. */
  readonly componentKey: string;
  /** Semantic version of this component. */
  readonly componentVersion: string;
  /** Category of this component. */
  readonly componentCategory: ComponentCategory;
  /** Whether the component is currently loading its primary content. */
  readonly loading: Signal<boolean> | boolean;
  /** Whether the component should show a skeleton placeholder. */
  readonly skeleton: Signal<boolean> | boolean;
  /** Human-readable identifier for accessibility. */
  readonly ariaLabel: Signal<string> | string;
  /** Component metadata for introspection. */
  readonly meta: PlatformComponentMeta;
}

/**
 * Minimal contract for stateless display components.
 */
export interface PlatformDisplayComponent extends PlatformComponent {
  readonly componentCategory: 'display';
}

/**
 * Static contract fulfilled by the class declaration (not the instance).
 * Used for registry type-checking.
 */
export interface PlatformComponentClass {
  readonly componentKey: string;
  readonly componentVersion: string;
  readonly componentCategory: ComponentCategory;
}

/**
 * Component that supports density configuration.
 */
export interface DensityAware {
  readonly density: Signal<ComponentDensity> | ComponentDensity;
}

/**
 * Component that supports RTL directionality.
 */
export interface DirectionAware {
  readonly dir: Signal<'ltr' | 'rtl'> | 'ltr' | 'rtl';
}

/**
 * Component that produces validation results.
 */
export interface ValidatableComponent {
  validate(): ValidationResult;
  readonly validationResult: Signal<ValidationResult>;
}
