import {
  Directive, input, model, output, computed, signal,
  inject, OnDestroy, effect, untracked,
} from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import {
  ComponentFieldType, ValidationResult, ValidatorSpec, PlatformComponentMeta,
} from '../component.types';
import { ComponentContextService } from '../context/component-context.service';
import { ComponentDiagnosticsService } from '../diagnostics/component-diagnostics.service';
import { ComponentMetricsService } from '../metrics/component-metrics.service';
import { ComponentTokensService } from '../tokens/component-tokens.service';

/**
 * Abstract base for all 19 platform field components.
 *
 * Provides all shared signal-based inputs, outputs, validation logic,
 * ARIA helpers, and lifecycle wiring. Concrete subclasses supply:
 * - `readonly componentKey` (static identifier)
 * - `readonly fieldType` (ComponentFieldType)
 * - a `@Component` decorator with template + styles
 */
@Directive()
export abstract class BaseFieldComponent<T = unknown> implements OnDestroy {
  protected readonly ctx         = inject(ComponentContextService);
  protected readonly diagnostics = inject(ComponentDiagnosticsService);
  protected readonly metrics     = inject(ComponentMetricsService);
  protected readonly tokens      = inject(ComponentTokensService);
  protected readonly cdr         = inject(ChangeDetectorRef);

  // ── Required abstract members ─────────────────────────────────────────────
  abstract readonly componentKey: string;
  abstract readonly fieldType: ComponentFieldType;

  // ── Identity inputs ───────────────────────────────────────────────────────
  readonly fieldKey    = input<string>('');
  readonly label       = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint        = input<string>('');
  readonly ariaLabel   = input<string>('');

  // ── Icon inputs ───────────────────────────────────────────────────────────
  readonly prefixIcon = input<string>('');
  readonly suffixIcon = input<string>('');

  // ── State flag inputs ─────────────────────────────────────────────────────
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading  = input<boolean>(false);
  readonly skeleton = input<boolean>(false);

  // ── Validation inputs ─────────────────────────────────────────────────────
  readonly errors     = input<string[]>([]);
  readonly validators = input<ValidatorSpec[]>([]);

  // ── Permission + expression inputs ───────────────────────────────────────
  readonly permissions        = input<string[]>([]);
  readonly hiddenExpression   = input<string>('');
  readonly disabledExpression = input<string>('');
  readonly valueExpression    = input<string>('');

  // ── Config ────────────────────────────────────────────────────────────────
  readonly config   = input<Record<string, unknown>>({});
  readonly metadata = input<unknown>(null);

  // ── Two-way value binding (concrete type per subclass via generic) ────────
  readonly value = model<T | null>(null);

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly blur             = output<void>();
  readonly focus            = output<void>();
  readonly validationChange = output<ValidationResult>();

  // ── Derived state ─────────────────────────────────────────────────────────

  /**
   * Effective disabled state: explicit input OR permission check failure.
   * Does NOT check the expression engine — that's a Dynamic Forms concern.
   */
  readonly isDisabled = computed(() =>
    this.disabled() || this._permissionDisabled(),
  );

  readonly hasErrors  = computed(() => this.errors().length > 0);
  readonly hintId     = computed(() => `pf-hint-${this.fieldKey() || this.componentKey}`);
  readonly fieldId    = computed(() => `pf-${this.fieldKey() || this.componentKey}`);
  readonly errorId    = computed(() => `pf-error-${this.fieldKey() || this.componentKey}`);

  readonly effectiveAriaLabel = computed(() =>
    this.ariaLabel() || this.label(),
  );

  readonly effectiveDensity = computed(() => this.ctx.currentDensity());

  readonly validationResult = computed<ValidationResult>(() => ({
    valid:    !this.hasErrors(),
    errors:   this.errors(),
    warnings: [],
  }));

  // Internal validation state (for validate() calls)
  private readonly _localErrors = signal<string[]>([]);

  get meta(): PlatformComponentMeta {
    return {
      componentKey: this.componentKey,
      version:  '5.0',
      category: 'field',
    } as unknown as PlatformComponentMeta;
  }

  constructor() {
    effect(() => {
      const result = this.validationResult();
      untracked(() => this.validationChange.emit(result));
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.diagnostics.recordLifecycle(this.componentKey, 'destroyed', this.fieldId());
  }

  // ── Public API ────────────────────────────────────────────────────────────

  validate(): ValidationResult {
    const result = this.validationResult();
    this.diagnostics.recordValidation(this.componentKey, result.valid, result.errors);
    return result;
  }

  // ── Event handlers for subclass templates ────────────────────────────────

  protected onBlur(): void   { this.blur.emit(); }
  protected onFocus(): void  { this.focus.emit(); }

  protected handleTextInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    (this.value as ReturnType<typeof model<string | null>>).set(val);
  }

  protected handleNumberInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const num = raw === '' ? null : Number(raw);
    this.value.set(num as unknown as T);
  }

  protected handleCheckboxChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.value.set(checked as unknown as T);
  }

  protected handleSelectChange(val: unknown): void {
    this.value.set(val as T);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  protected get skeletonRows(): number[] {
    return [1, 2];
  }

  private _permissionDisabled(): boolean {
    const required = this.permissions();
    if (!required.length) return false;
    return !required.every(p => this.ctx.hasPermission(p));
  }
}
