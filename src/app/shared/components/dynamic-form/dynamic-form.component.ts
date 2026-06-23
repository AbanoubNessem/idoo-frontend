import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  SimpleChanges, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FormSchema, FormMode } from '../../models/dynamic-form.models';

/**
 * Dynamic Form Engine — renders any FormSchema as a reactive form.
 * Supports create / edit / view modes.
 * ChangeDetectionStrategy.OnPush for performance.
 */
@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatCheckboxModule, MatSlideToggleModule,
    MatButtonModule, MatDividerModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dynamic-form">
      <div class="form-grid" [class.cols-2]="schema.columns === 2" [class.cols-3]="schema.columns === 3">
        @for (field of visibleFields; track field.key) {
          @if (field.type === 'divider') {
            <mat-divider class="col-span-full" />
          } @else if (field.type === 'section') {
            <h3 class="col-span-full section-title">{{ field.label }}</h3>
          } @else {
            <mat-form-field
              [class.col-span-full]="field.fullWidth"
              appearance="outline"
            >
              <mat-label>{{ field.label }}</mat-label>

              @switch (field.type) {
                @case ('textarea') {
                  <textarea matInput [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" rows="3" [readonly]="isView"></textarea>
                }
                @case ('select') {
                  <mat-select [formControlName]="field.key">
                    @for (opt of field.options; track opt.value) {
                      <mat-option [value]="opt.value" [disabled]="opt.disabled ?? false">{{ opt.label }}</mat-option>
                    }
                  </mat-select>
                }
                @case ('multiselect') {
                  <mat-select [formControlName]="field.key" multiple>
                    @for (opt of field.options; track opt.value) {
                      <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                    }
                  </mat-select>
                }
                @default {
                  <input matInput [type]="field.type" [formControlName]="field.key" [placeholder]="field.placeholder ?? ''" [readonly]="isView" />
                }
              }

              @if (field.hint) {
                <mat-hint>{{ field.hint }}</mat-hint>
              }

              @if (form.get(field.key)?.invalid && form.get(field.key)?.touched) {
                <mat-error>{{ getErrorMessage(field.key, field.errorMessages) }}</mat-error>
              }
            </mat-form-field>
          }
        }
      </div>

      @if (!isView) {
        <div class="form-actions">
          <button mat-button type="button" (click)="onCancel()">{{ schema.cancelLabel ?? 'Cancel' }}</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || form.pristine">
            {{ schema.submitLabel ?? 'Save' }}
          </button>
        </div>
      }
    </form>
  `,
  styles: [`
    .form-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
    .form-grid.cols-2 { grid-template-columns: 1fr 1fr; }
    .form-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
    .col-span-full { grid-column: 1 / -1; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .section-title { font-weight: 500; margin: 0; }
  `],
})
export class DynamicFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input({ required: true }) schema!: FormSchema;
  @Input() mode: FormMode = 'create';
  @Input() data: Record<string, unknown> | null = null;
  @Output() submitted = new EventEmitter<Record<string, unknown>>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;

  get isView(): boolean { return this.mode === 'view'; }
  get visibleFields() {
    return this.schema.fields
      .filter(f => !f.hidden && (!f.showWhen || f.showWhen(this.form?.value ?? {})))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.form) {
      this.patchFormData();
    }
  }

  private buildForm(): void {
    const controls: Record<string, unknown[]> = {};
    for (const field of this.schema.fields) {
      const validators = field.validators ? [...field.validators] : [];
      if (field.required) validators.push(Validators.required);
      controls[field.key] = [field.defaultValue ?? null, validators];
    }
    this.form = this.fb.group(controls);
    if (this.isView) this.form.disable();
    this.patchFormData();
  }

  private patchFormData(): void {
    if (this.data) {
      this.form.patchValue(this.data);
    }
  }

  getErrorMessage(key: string, errorMessages?: Record<string, string>): string {
    const control = this.form.get(key);
    if (!control?.errors) return '';
    const errorKey = Object.keys(control.errors)[0];
    return errorMessages?.[errorKey] ?? `Field is ${errorKey}`;
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submitted.emit(this.form.getRawValue());
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
