import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TableBodyComponent } from '../table-body/table-body.component';
import { TableCellComponent } from '../table-cell/table-cell.component';
import { TableEmptyComponent } from '../table-empty/table-empty.component';
import { TableErrorComponent } from '../table-error/table-error.component';
import { TableFooterComponent } from '../table-footer/table-footer.component';
import { TableHeaderComponent } from '../table-header/table-header.component';
import { TableLoadingComponent } from '../table-loading/table-loading.component';
import { TableToolbarComponent } from '../table-toolbar/table-toolbar.component';
import { TableActionNode, TableRenderPlan } from '../../rendering.types';

// ─── TableShellComponent ──────────────────────────────────────────────────────
// Top-level rendering component. Consumes a TableRenderPlan (never raw metadata).
// Dispatches to sub-components; never renders cells or data directly.

@Component({
  selector:        'platform-table',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableHeaderComponent,
    TableBodyComponent,
    TableCellComponent,
    TableFooterComponent,
    TableToolbarComponent,
    TableEmptyComponent,
    TableLoadingComponent,
    TableErrorComponent,
  ],
  template: `
    <div
      class="pt-shell"
      [attr.data-density]="plan().density"
      [attr.data-table-id]="plan().tableId"
      [attr.aria-busy]="plan().state === 'loading'"
    >

      <!-- Toolbar -->
      @if (plan().hasToolbar && plan().toolbar) {
        <platform-table-toolbar
          [node]="plan().toolbar!"
          (actionClicked)="actionClicked.emit($event)"
          (refreshClicked)="refreshClicked.emit()"
          (densityClicked)="densityClicked.emit()"
          (columnPickerClicked)="columnPickerClicked.emit()"
          (exportClicked)="exportClicked.emit()"
          (printClicked)="printClicked.emit()"
          (searchChanged)="searchChanged.emit($event)"
        />
      }

      <!-- Header (always rendered for layout stability) -->
      <platform-table-header [cells]="plan().headerCells" />

      <!-- State-driven body -->
      @switch (plan().state) {
        @case ('loading') {
          <platform-table-loading [node]="plan().loading" />
        }
        @case ('error') {
          <platform-table-error [node]="plan().error" (retry)="retryClicked.emit()" />
        }
        @case ('empty') {
          <platform-table-empty [node]="plan().empty" />
        }
        @default {
          <platform-table-body [bodyCells]="plan().bodyCells" [rows]="rows()" />
        }
      }

      <!-- Footer / Summary -->
      @if (plan().hasFooter && plan().state === 'ready') {
        <platform-table-footer [cells]="plan().footerCells" [rows]="rows()" />
      }

    </div>
  `,
  styles: [`
    .pt-shell {
      display: flex; flex-direction: column; overflow: hidden;
      border: 1px solid var(--platform-color-border, #e0e0e0);
      border-radius: var(--platform-border-radius, 4px);
      background: var(--platform-color-surface, #fff);
      font-family: var(--platform-font-family, inherit);
    }

    /* Density variants */
    .pt-shell[data-density="compact"] { font-size: 0.8rem; }
    .pt-shell[data-density="comfortable"] { font-size: 0.9375rem; }
  `],
})
export class TableShellComponent {
  readonly plan = input.required<TableRenderPlan>();
  readonly rows = input<Record<string, unknown>[]>([]);

  readonly actionClicked       = output<TableActionNode>();
  readonly refreshClicked      = output<void>();
  readonly densityClicked      = output<void>();
  readonly columnPickerClicked = output<void>();
  readonly exportClicked       = output<void>();
  readonly printClicked        = output<void>();
  readonly retryClicked        = output<void>();
  readonly searchChanged       = output<string>();

  readonly hasData = computed(() => this.rows().length > 0);
}
