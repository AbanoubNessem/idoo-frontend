import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  effect,
  EffectRef,
  inject,
  Injector,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FieldDefinition, FieldState } from '../../form.types';

export interface FieldValueChangeEvent {
  readonly key:   string;
  readonly value: unknown;
}

// ─── FormFieldHostComponent ───────────────────────────────────────────────────
// Dynamically creates a platform field component, applies field state as inputs,
// and routes value changes back via (valueChange) output.
// MUST NOT render field components directly — uses ViewContainerRef + Type<unknown>.

@Component({
  selector:          'df-field-host',
  standalone:        true,
  changeDetection:   ChangeDetectionStrategy.OnPush,
  template:          `<ng-container #fieldHost/>`,
  host: {
    '[attr.data-field-key]': 'fieldDef().key',
    'class':                 'df-field-host',
  },
  styles: [`
    :host { display: block; width: 100%; }
    :host.df-field-host { contain: layout; }
  `],
})
export class FormFieldHostComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('fieldHost', { read: ViewContainerRef, static: true })
  private readonly vcr!: ViewContainerRef;

  private readonly injector = inject(Injector);

  readonly fieldDef     = input.required<FieldDefinition>();
  readonly fieldState   = input.required<FieldState>();
  readonly componentType = input<Type<unknown> | null>(null);

  readonly valueChange = output<FieldValueChangeEvent>();
  readonly fieldBlur   = output<string>();
  readonly fieldFocus  = output<string>();

  private _ref: ComponentRef<unknown> | null = null;
  private _effectRef: EffectRef | null = null;
  private _lastEmittedValue: unknown = Symbol('init');

  ngOnInit(): void {
    this._mount();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['componentType'] && !changes['componentType'].firstChange) {
      this._mount();
    } else if (this._ref && (changes['fieldState'] || changes['fieldDef'])) {
      this._applyInputs();
    }
  }

  ngOnDestroy(): void {
    this._destroy();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private _mount(): void {
    this._destroy();
    const type = this.componentType();
    if (!type) return;

    this.vcr.clear();
    this._ref = this.vcr.createComponent(type);
    this._applyInputs();
    this._wireOutputs();
    this._ref.changeDetectorRef.detectChanges();
  }

  private _applyInputs(): void {
    const ref = this._ref;
    if (!ref) return;

    const def   = this.fieldDef();
    const state = this.fieldState();

    ref.setInput('fieldKey',    def.key);
    ref.setInput('label',       def.label);
    ref.setInput('placeholder', def.placeholder ?? '');
    ref.setInput('hint',        def.hint ?? '');
    ref.setInput('ariaLabel',   def.ariaLabel ?? def.label);
    ref.setInput('prefixIcon',  def.prefixIcon ?? '');
    ref.setInput('suffixIcon',  def.suffixIcon ?? '');
    ref.setInput('config',      def.config ?? {});
    ref.setInput('metadata',    def.metadata ?? null);

    // Only update value if it differs from what we last saw the component emit
    // to break the two-way update loop.
    if (state.value !== this._lastEmittedValue) {
      ref.setInput('value', state.value);
    }

    ref.setInput('errors',    state.errors);
    ref.setInput('disabled',  state.disabled);
    ref.setInput('readonly',  state.readonly);
    ref.setInput('required',  state.required);
    ref.setInput('loading',   state.loading);
    ref.setInput('skeleton',  state.skeleton);
    ref.setInput('validators', def.validators ?? []);
    ref.setInput('permissions', def.permissions ?? []);
    ref.setInput('hiddenExpression',  def.hiddenExpression ?? '');
    ref.setInput('disabledExpression', def.disabledExpression ?? '');
    ref.setInput('valueExpression',   def.valueExpression ?? '');

    ref.changeDetectorRef.markForCheck();
  }

  private _wireOutputs(): void {
    const ref = this._ref;
    if (!ref) return;

    const inst = ref.instance as Record<string, unknown>;

    // Watch the value signal from BaseFieldComponent using effect().
    // We use the component's own injector so the effect is destroyed with it.
    const valueSig = inst['value'];
    if (valueSig && typeof valueSig === 'function') {
      this._effectRef = effect(() => {
        const v = (valueSig as () => unknown)();
        // Use untracked in the emit to avoid reactive loop
        const key = this.fieldDef().key;
        if (v !== this._lastEmittedValue) {
          this._lastEmittedValue = v;
          this.valueChange.emit({ key, value: v });
        }
      }, { injector: this.injector });
    }

    // Subscribe to blur/focus EventEmitters
    const blur = inst['blur'];
    if (blur && typeof (blur as { subscribe?: unknown }).subscribe === 'function') {
      (blur as { subscribe: (fn: () => void) => void }).subscribe(() => {
        this.fieldBlur.emit(this.fieldDef().key);
      });
    }

    const focus = inst['focus'];
    if (focus && typeof (focus as { subscribe?: unknown }).subscribe === 'function') {
      (focus as { subscribe: (fn: () => void) => void }).subscribe(() => {
        this.fieldFocus.emit(this.fieldDef().key);
      });
    }
  }

  private _destroy(): void {
    this._effectRef?.destroy();
    this._effectRef = null;
    this._ref?.destroy();
    this._ref = null;
    this._lastEmittedValue = Symbol('init');
  }
}
