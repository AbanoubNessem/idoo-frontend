import { EventEmitter, Signal } from '@angular/core';
import { ComponentFieldType, ValidationResult, ValidatorSpec } from '../component.types';
import { PlatformComponent } from './platform-component';

/**
 * Contract for all platform field components.
 *
 * Business modules bind to this interface — never to Angular Material or any
 * other UI framework directly. The underlying implementation is an internal
 * detail of the Platform Component Library.
 */
export interface PlatformFieldComponent<T = unknown> extends PlatformComponent {
  readonly componentCategory: 'field';

  // ── Identity ─────────────────────────────────────────────────────────────
  /** Machine-readable key for the field within its form. */
  readonly fieldKey: Signal<string> | string;
  /** Field type that drives the control strategy. */
  readonly fieldType: ComponentFieldType;

  // ── Label & UX ──────────────────────────────────────────────────────────
  readonly label: Signal<string> | string;
  readonly placeholder: Signal<string> | string;
  readonly hint: Signal<string> | string;
  readonly prefixIcon: Signal<string> | string;
  readonly suffixIcon: Signal<string> | string;

  // ── State Flags ──────────────────────────────────────────────────────────
  readonly disabled: Signal<boolean> | boolean;
  readonly readonly: Signal<boolean> | boolean;
  readonly required: Signal<boolean> | boolean;

  // ── Value ────────────────────────────────────────────────────────────────
  readonly value: Signal<T | null>;
  readonly valueChange: EventEmitter<T | null>;

  // ── Validation ───────────────────────────────────────────────────────────
  readonly errors: Signal<string[]>;
  readonly validators: Signal<ValidatorSpec[]>;
  readonly validationResult: Signal<ValidationResult>;
  validate(): ValidationResult;

  // ── Permissions ──────────────────────────────────────────────────────────
  /** Permission keys required to edit this field. If not satisfied, field is readonly. */
  readonly permissions: Signal<string[]>;

  // ── Expression Binding ──────────────────────────────────────────────────
  /** Angular expression evaluated to determine if this field is hidden. */
  readonly hiddenExpression: Signal<string>;
  /** Angular expression evaluated to determine if this field is disabled. */
  readonly disabledExpression: Signal<string>;
  /** Angular expression evaluated to compute the field value from the model. */
  readonly valueExpression: Signal<string>;

  // ── Interaction Events ───────────────────────────────────────────────────
  readonly blur: EventEmitter<void>;
  readonly focus: EventEmitter<void>;
  readonly validationChange: EventEmitter<ValidationResult>;
}
