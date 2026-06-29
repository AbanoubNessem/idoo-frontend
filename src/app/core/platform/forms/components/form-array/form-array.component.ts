import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormFieldHostComponent, FieldValueChangeEvent } from '../form-field-host/form-field-host.component';
import { DynamicFormState } from '../../state/dynamic-form-state';
import { ArrayFieldDefinition, FieldDefinition, FieldState } from '../../form.types';
import { ComponentFieldType } from '../../../components/component.types';
import { ResolvedField } from '../../form.types';

export interface ArrayItemChangeEvent {
  readonly fieldKey:  string;
  readonly itemIndex: number;
  readonly itemKey:   string;
  readonly value:     unknown;
}

// ─── FormArrayComponent ────────────────────────────────────────────────────────
// Renders a repeating array field — each item is a row of fields based on itemSchema.
// Supports add/remove/reorder. Delegates each field to FormFieldHostComponent.

@Component({
  selector:        'df-array',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [FormFieldHostComponent],
  template: `
    <div class="df-array">
      @if (def().label) {
        <label class="df-array-label">{{ def().label }}</label>
      }

      <!-- Items -->
      @for (item of items(); track item.index) {
        <div class="df-array-item">
          <div class="df-array-item-fields">
            @for (field of resolvedItemFields(); track field.key) {
              <df-field-host
                [fieldDef]="itemFieldDef(field, item.index)"
                [fieldState]="itemFieldState(field, item.index)"
                [componentType]="field.componentType"
                (valueChange)="onItemValueChange($event, item.index)"
                (fieldBlur)="fieldBlur.emit($event)"
                (fieldFocus)="fieldFocus.emit($event)"
              />
            }
          </div>
          @if (!isDisabled()) {
            <button
              type="button"
              class="df-array-remove"
              [attr.aria-label]="def().removeLabel ?? 'Remove item'"
              (click)="removeItem(item.index)"
              [disabled]="atMin()"
            >
              &#8722;
            </button>
          }
          @if (def().sortable && item.index > 0 && !isDisabled()) {
            <button type="button" class="df-array-move" (click)="moveUp(item.index)" aria-label="Move up">&#8593;</button>
          }
        </div>
      }

      <!-- Add button -->
      @if (!isDisabled()) {
        <button
          type="button"
          class="df-array-add"
          [disabled]="atMax()"
          (click)="addItem()"
        >
          + {{ def().addLabel ?? 'Add item' }}
        </button>
      }

      @if (atMax()) {
        <p class="df-array-hint">Maximum {{ def().maxItems }} items</p>
      }
    </div>
  `,
  styles: [`
    .df-array { width: 100%; }
    .df-array-label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 8px; }
    .df-array-item {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 12px; border: 1px solid var(--platform-color-border, #e0e0e0);
      border-radius: var(--platform-border-radius, 4px); margin-bottom: 8px;
    }
    .df-array-item-fields { flex: 1; display: grid; gap: 12px; }
    .df-array-remove, .df-array-move {
      width: 32px; height: 32px; border: 1px solid #e0e0e0; border-radius: 4px;
      background: #fafafa; cursor: pointer; flex-shrink: 0; font-size: 1rem;
    }
    .df-array-remove:disabled, .df-array-add:disabled { opacity: 0.4; cursor: not-allowed; }
    .df-array-add {
      width: 100%; padding: 10px; border: 2px dashed var(--platform-color-border, #e0e0e0);
      border-radius: var(--platform-border-radius, 4px); background: #fafafa;
      cursor: pointer; color: var(--platform-color-primary, #1976d2);
      font-size: 0.875rem; font-weight: 500; margin-top: 8px;
    }
    .df-array-hint { font-size: 0.75rem; color: #9e9e9e; margin-top: 4px; }
  `],
})
export class FormArrayComponent {
  readonly def       = input.required<ArrayFieldDefinition>();
  readonly formState = input.required<DynamicFormState>();

  readonly valueChange = output<ArrayItemChangeEvent>();
  readonly fieldBlur   = output<string>();
  readonly fieldFocus  = output<string>();
  readonly itemAdded   = output<number>();
  readonly itemRemoved = output<number>();

  private readonly _items = signal<{ index: number; data: Record<string, unknown> }[]>([]);

  readonly items = this._items.asReadonly();

  readonly resolvedItemFields = computed((): ResolvedField[] =>
    (this.def().itemSchema.fields ?? []) as ResolvedField[],
  );

  readonly isDisabled = computed(() =>
    this.formState().getField(this.def().key).disabled,
  );

  readonly atMin = computed(() => {
    const min = this.def().minItems ?? 0;
    return this._items().length <= min;
  });

  readonly atMax = computed(() => {
    const max = this.def().maxItems;
    return max != null && this._items().length >= max;
  });

  addItem(): void {
    if (this.atMax()) return;
    const index = this._items().length;
    this._items.update(items => [...items, { index, data: {} }]);
    this.itemAdded.emit(index);
  }

  removeItem(index: number): void {
    if (this.atMin()) return;
    this._items.update(items =>
      items.filter(i => i.index !== index).map((item, i) => ({ ...item, index: i })),
    );
    this.itemRemoved.emit(index);
  }

  moveUp(index: number): void {
    if (index === 0) return;
    this._items.update(items => {
      const next = [...items];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((item, i) => ({ ...item, index: i }));
    });
  }

  itemFieldDef(field: ResolvedField, itemIndex: number): FieldDefinition {
    return { ...field, key: `${this.def().key}[${itemIndex}].${field.key}` };
  }

  itemFieldState(field: ResolvedField, itemIndex: number): FieldState {
    const compositeKey = `${this.def().key}[${itemIndex}].${field.key}`;
    return this.formState().getField(compositeKey);
  }

  onItemValueChange(event: FieldValueChangeEvent, itemIndex: number): void {
    this._items.update(items =>
      items.map(item =>
        item.index === itemIndex
          ? { ...item, data: { ...item.data, [event.key]: event.value } }
          : item,
      ),
    );
    this.valueChange.emit({
      fieldKey:  this.def().key,
      itemIndex,
      itemKey:   event.key,
      value:     event.value,
    });
  }
}
