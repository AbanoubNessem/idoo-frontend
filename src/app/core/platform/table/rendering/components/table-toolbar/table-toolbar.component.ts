import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TableActionNode, TableToolbarNode } from '../../rendering.types';

@Component({
  selector:        'platform-table-toolbar',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pt-toolbar" role="toolbar">

      @if (node().showSearch) {
        <div class="pt-toolbar__search">
          <input
            type="search"
            class="pt-toolbar__search-input"
            [placeholder]="node().searchPlaceholder"
            [value]="searchValue()"
            (input)="onSearchInput($event)"
            aria-label="Search"
          />
        </div>
      }

      <div class="pt-toolbar__spacer" aria-hidden="true"></div>

      <div class="pt-toolbar__actions" role="group" aria-label="Table actions">
        @for (action of toolbarActions(); track action.actionId) {
          <button
            type="button"
            class="pt-toolbar__action"
            [class]="'pt-toolbar__action--' + action.variant"
            [attr.data-action-id]="action.actionId"
            [attr.aria-label]="action.label"
            (click)="actionClicked.emit(action)"
          >
            @if (action.icon) {
              <span class="pt-toolbar__action-icon" aria-hidden="true" [innerHTML]="action.icon"></span>
            }
            <span class="pt-toolbar__action-label">{{ action.label }}</span>
          </button>
        }

        @if (node().showRefresh) {
          <button type="button" class="pt-toolbar__icon-btn" aria-label="Refresh" (click)="refreshClicked.emit()">
            &#8635;
          </button>
        }

        @if (node().showDensity) {
          <button type="button" class="pt-toolbar__icon-btn" aria-label="Toggle density" (click)="densityClicked.emit()">
            &#8801;
          </button>
        }

        @if (node().showColumnPicker) {
          <button type="button" class="pt-toolbar__icon-btn" aria-label="Column visibility" (click)="columnPickerClicked.emit()">
            &#9707;
          </button>
        }

        @if (node().showExport) {
          <button type="button" class="pt-toolbar__icon-btn" aria-label="Export" (click)="exportClicked.emit()">
            &#11014;
          </button>
        }

        @if (node().showPrint) {
          <button type="button" class="pt-toolbar__icon-btn" aria-label="Print" (click)="printClicked.emit()">
            &#128438;
          </button>
        }
      </div>

    </div>
  `,
  styles: [`
    .pt-toolbar {
      display: flex; align-items: center; gap: 8px; padding: 8px 12px;
      border-bottom: 1px solid var(--platform-color-border, #e0e0e0);
      background: var(--platform-color-surface, #fff);
    }
    .pt-toolbar__search { display: flex; align-items: center; }
    .pt-toolbar__search-input {
      padding: 6px 12px; border: 1px solid var(--platform-color-border, #e0e0e0);
      border-radius: 4px; font-size: 0.875rem; outline: none;
      min-width: 200px;
    }
    .pt-toolbar__search-input:focus { border-color: var(--platform-color-primary, #1976d2); }
    .pt-toolbar__spacer { flex: 1; }
    .pt-toolbar__actions { display: flex; align-items: center; gap: 4px; }

    .pt-toolbar__action {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 14px; border-radius: 4px; font-size: 0.8rem;
      font-weight: 500; cursor: pointer; border: none; white-space: nowrap;
    }
    .pt-toolbar__action--primary  { background: var(--platform-color-primary, #1976d2); color: #fff; }
    .pt-toolbar__action--secondary { background: #f5f5f5; color: #424242; }
    .pt-toolbar__action--danger   { background: var(--platform-color-error, #d32f2f); color: #fff; }
    .pt-toolbar__action--ghost    { background: none; color: #757575; border: 1px solid #bdbdbd; }
    .pt-toolbar__action-icon { font-size: 0.9rem; }

    .pt-toolbar__icon-btn {
      width: 32px; height: 32px; border: 1px solid var(--platform-color-border, #e0e0e0);
      border-radius: 4px; background: none; cursor: pointer; font-size: 1rem;
      display: inline-flex; align-items: center; justify-content: center;
      color: var(--platform-color-secondary, #757575);
    }
    .pt-toolbar__icon-btn:hover { background: var(--platform-color-hover, #f5f5f5); }
  `],
})
export class TableToolbarComponent {
  readonly node = input.required<TableToolbarNode>();

  readonly actionClicked       = output<TableActionNode>();
  readonly refreshClicked      = output<void>();
  readonly densityClicked      = output<void>();
  readonly columnPickerClicked = output<void>();
  readonly exportClicked       = output<void>();
  readonly printClicked        = output<void>();
  readonly searchChanged       = output<string>();

  readonly searchValue = signal('');

  readonly toolbarActions = () =>
    this.node().toolbarActions.filter(a => a.position === 'toolbar');

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    this.searchChanged.emit(value);
  }
}
