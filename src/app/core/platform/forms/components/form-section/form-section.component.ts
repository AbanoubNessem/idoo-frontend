import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { FormFieldHostComponent, FieldValueChangeEvent } from '../form-field-host/form-field-host.component';
import { FormArrayComponent, ArrayItemChangeEvent } from '../form-array/form-array.component';
import { DynamicFormState } from '../../state/dynamic-form-state';
import { ArrayFieldDefinition, FieldState, ResolvedSection } from '../../form.types';
import { FormLayoutAdapter } from '../../../layout/form-layout.adapter';
import { LayoutRendererService } from '../../../layout/layout-renderer.service';

// ─── FormSectionComponent ─────────────────────────────────────────────────────
// Renders a single resolved section: title + field grid.
// Uses FormFieldHostComponent for each field — never creates field components directly.

@Component({
  selector:        'df-section',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [FormFieldHostComponent, FormArrayComponent, NgStyle],
  template: `
    @if (!hidden()) {
      <div class="df-section" [class.df-section--collapsed]="isCollapsed()">

        @if (section().title) {
          <div class="df-section-header" (click)="toggleCollapse()">
            <h3 class="df-section-title">{{ section().title }}</h3>
            @if (section().collapsible) {
              <span class="df-section-chevron" [class.df-section-chevron--up]="!isCollapsed()">
                &#8963;
              </span>
            }
          </div>
        }

        @if (!isCollapsed()) {
          <div class="df-section-body">

            <!-- Direct fields -->
            @if ((section().fields ?? []).length > 0) {
              <div class="df-field-grid" [ngStyle]="sectionBodyStyle()">
                @for (field of section().fields ?? []; track field.key) {
                  @if (!getFieldState(field.key).hidden) {
                    <div
                      class="df-field-slot"
                      [style.grid-column]="fieldSpan(field.span)"
                    >
                      <df-field-host
                        [fieldDef]="field"
                        [fieldState]="getFieldState(field.key)"
                        [componentType]="field.componentType"
                        (valueChange)="onValueChange($event)"
                        (fieldBlur)="onFieldBlur($event)"
                        (fieldFocus)="onFieldFocus($event)"
                      />
                    </div>
                  }
                }
              </div>
            }

            <!-- Groups -->
            @for (group of section().groups ?? []; track group.id) {
              <div class="df-group">
                @if (group.title) {
                  <h4 class="df-group-title">{{ group.title }}</h4>
                }
                <div class="df-field-grid" [ngStyle]="groupBodyStyle(group.columns)">
                  @for (field of group.fields; track field.key) {
                    @if (!getFieldState(field.key).hidden) {
                      <div class="df-field-slot" [style.grid-column]="fieldSpan(field.span)">
                        <df-field-host
                          [fieldDef]="field"
                          [fieldState]="getFieldState(field.key)"
                          [componentType]="field.componentType"
                          (valueChange)="onValueChange($event)"
                          (fieldBlur)="onFieldBlur($event)"
                          (fieldFocus)="onFieldFocus($event)"
                        />
                      </div>
                    }
                  }
                </div>
              </div>
            }

            <!-- Arrays -->
            @for (arr of section().arrays ?? []; track arr.key) {
              @if (!getFieldState(arr.key).hidden) {
                <div class="df-array-slot">
                  <df-array
                    [def]="arr"
                    [formState]="formState()"
                    (valueChange)="onArrayChange($event)"
                    (fieldBlur)="onFieldBlur($event)"
                    (fieldFocus)="onFieldFocus($event)"
                  />
                </div>
              }
            }

            <!-- Subsections -->
            @for (sub of section().subsections ?? []; track sub.id) {
              <df-section
                [section]="sub"
                [formState]="formState()"
                (valueChange)="onValueChange($event)"
                (fieldBlur)="onFieldBlur($event)"
                (fieldFocus)="onFieldFocus($event)"
              />
            }

          </div>
        }

      </div>
    }
  `,
  styles: [`
    .df-section { margin-bottom: 24px; }
    .df-section-header {
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; padding: 8px 0; border-bottom: 1px solid var(--platform-color-border, #e0e0e0);
      margin-bottom: 16px;
    }
    .df-section-title { margin: 0; font-size: 1rem; font-weight: 600; }
    .df-section-chevron { font-size: 1.2rem; transition: transform 200ms; }
    .df-section-chevron--up { transform: rotate(180deg); }
    .df-section--collapsed .df-section-body { display: none; }
    .df-field-grid { display: grid; gap: 16px; }
    .df-group { margin-bottom: 16px; }
    .df-group-title { margin: 0 0 8px; font-size: 0.875rem; font-weight: 500; color: var(--platform-color-label, #616161); }
  `],
})
export class FormSectionComponent {
  private readonly _layoutAdapter = inject(FormLayoutAdapter);
  private readonly _layoutRenderer = inject(LayoutRendererService);

  readonly section   = input.required<ResolvedSection>();
  readonly formState = input.required<DynamicFormState>();

  readonly valueChange = output<FieldValueChangeEvent>();
  readonly fieldBlur   = output<string>();
  readonly fieldFocus  = output<string>();

  private _collapsed = false;

  readonly sectionState = computed(() =>
    this.formState().getSection(this.section().id),
  );

  readonly hidden = computed(() => this.sectionState().hidden);

  readonly isCollapsed = computed(() =>
    this.section().collapsible && this._collapsed,
  );

  readonly sectionBodyStyle = computed((): Record<string, string> => {
    const s = this.section();
    const layoutDef = this._layoutAdapter.sectionToLayoutDefinition(s);
    const output = this._layoutRenderer.render(layoutDef, {
      breakpoint: 'md', device: 'desktop', orientation: 'landscape',
      direction: 'ltr', permissions: [], model: {},
    });
    return output.hostCss as Record<string, string>;
  });

  getFieldState(key: string): FieldState {
    return this.formState().getField(key);
  }

  fieldSpan(span: number | undefined): string {
    return span ? `span ${span}` : 'auto';
  }

  groupBodyStyle(columns: number | undefined): Record<string, string> {
    const output = this._layoutRenderer.render(
      { id: '_group', type: 'grid', config: { grid: { columns: columns || 1, gap: 'var(--platform-spacing-4)' } } },
      { breakpoint: 'md', device: 'desktop', orientation: 'landscape', direction: 'ltr', permissions: [], model: {} },
    );
    return output.hostCss as Record<string, string>;
  }

  toggleCollapse(): void {
    if (!this.section().collapsible) return;
    this._collapsed = !this._collapsed;
  }

  onValueChange(event: FieldValueChangeEvent): void {
    this.valueChange.emit(event);
  }

  onArrayChange(event: ArrayItemChangeEvent): void {
    this.valueChange.emit({ key: event.fieldKey, value: event });
  }

  onFieldBlur(key: string): void {
    this.fieldBlur.emit(key);
  }

  onFieldFocus(key: string): void {
    this.fieldFocus.emit(key);
  }
}
