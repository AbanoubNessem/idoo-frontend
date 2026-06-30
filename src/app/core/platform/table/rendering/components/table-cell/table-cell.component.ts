import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TableCellRendererService } from '../../renderers/table-cell-renderer.service';
import { TableBodyCellNode } from '../../rendering.types';

@Component({
  selector:        'platform-table-cell',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pt-cell"
      [class.pt-cell--sticky-start]="node().sticky === 'start'"
      [class.pt-cell--sticky-end]="node().sticky === 'end'"
      [style.width]="node().width"
      [attr.data-column-id]="node().columnId"
      [attr.data-type]="node().columnType"
    >
      @switch (node().columnType) {
        @case ('boolean') {
          <span class="pt-cell__bool" [attr.aria-label]="cellValue().formatted">
            {{ cellValue().isEmpty ? '' : (cellValue().raw ? '✓' : '✗') }}
          </span>
        }
        @case ('link') {
          @if (!cellValue().isEmpty) {
            <a class="pt-cell__link" [href]="cellValue().formatted" target="_blank" rel="noopener">
              {{ cellValue().formatted }}
            </a>
          }
        }
        @case ('email') {
          @if (!cellValue().isEmpty) {
            <a class="pt-cell__link" [href]="'mailto:' + cellValue().formatted">
              {{ cellValue().formatted }}
            </a>
          }
        }
        @case ('phone') {
          @if (!cellValue().isEmpty) {
            <a class="pt-cell__link" [href]="'tel:' + cellValue().formatted">
              {{ cellValue().formatted }}
            </a>
          }
        }
        @case ('image') {
          @if (!cellValue().isEmpty) {
            <img class="pt-cell__img" [src]="cellValue().formatted" alt="" loading="lazy" />
          }
        }
        @case ('avatar') {
          <div class="pt-cell__avatar">
            @if (!cellValue().isEmpty) {
              <img class="pt-cell__avatar-img" [src]="cellValue().formatted" alt="" loading="lazy" />
            } @else {
              <span class="pt-cell__avatar-placeholder" aria-hidden="true">&#9786;</span>
            }
          </div>
        }
        @case ('progress') {
          <div class="pt-cell__progress-wrap" [attr.aria-valuenow]="rawNumber()" aria-valuemin="0" aria-valuemax="100" role="progressbar">
            <div class="pt-cell__progress-bar" [style.width.%]="rawNumber()"></div>
            <span class="pt-cell__progress-label">{{ cellValue().formatted }}</span>
          </div>
        }
        @case ('badge') {
          <span class="pt-cell__badge">{{ cellValue().formatted }}</span>
        }
        @case ('chip') {
          <span class="pt-cell__chip">{{ cellValue().formatted }}</span>
        }
        @case ('status') {
          <span class="pt-cell__status" [attr.data-status]="cellValue().formatted">
            <span class="pt-cell__status-dot" aria-hidden="true"></span>
            {{ cellValue().formatted }}
          </span>
        }
        @case ('tag') {
          <span class="pt-cell__tag">{{ cellValue().formatted }}</span>
        }
        @case ('icon') {
          <span class="pt-cell__icon" aria-hidden="true">{{ cellValue().formatted }}</span>
        }
        @case ('rating') {
          <span class="pt-cell__rating" [attr.aria-label]="cellValue().formatted + ' stars'">
            {{ cellValue().formatted }}
          </span>
        }
        @case ('custom') {
          <span class="pt-cell__custom" [attr.data-renderer]="node().renderer">
            {{ cellValue().formatted }}
          </span>
        }
        @default {
          <span class="pt-cell__text">{{ cellValue().formatted }}</span>
        }
      }
    </div>
  `,
  styles: [`
    .pt-cell {
      flex: 1; display: flex; align-items: center; padding: 8px 12px;
      overflow: hidden; font-size: 0.875rem; color: var(--platform-color-text, #212121);
    }
    .pt-cell--sticky-start { position: sticky; left: 0; background: var(--platform-color-surface, #fff); z-index: 1; }
    .pt-cell--sticky-end   { position: sticky; right: 0; background: var(--platform-color-surface, #fff); z-index: 1; }

    .pt-cell__text, .pt-cell__custom { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pt-cell__bool { font-size: 1rem; }

    .pt-cell__link { color: var(--platform-color-primary, #1976d2); text-decoration: none; }
    .pt-cell__link:hover { text-decoration: underline; }

    .pt-cell__img { max-width: 40px; max-height: 40px; border-radius: 4px; object-fit: cover; }

    .pt-cell__avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
      background: var(--platform-color-border, #e0e0e0); display: flex; align-items: center; justify-content: center; }
    .pt-cell__avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .pt-cell__avatar-placeholder { font-size: 1.2rem; color: #9e9e9e; }

    .pt-cell__progress-wrap {
      flex: 1; position: relative; display: flex; align-items: center;
      background: var(--platform-color-border, #e0e0e0); border-radius: 4px; overflow: hidden; height: 8px;
    }
    .pt-cell__progress-bar {
      height: 100%; background: var(--platform-color-primary, #1976d2);
      border-radius: 4px; transition: width 300ms;
    }
    .pt-cell__progress-label { position: absolute; right: 0; font-size: 0.7rem; color: #fff; padding: 0 4px; }

    .pt-cell__badge {
      display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px;
      font-size: 0.75rem; font-weight: 500;
      background: var(--platform-color-primary-light, #e3f2fd);
      color: var(--platform-color-primary, #1976d2);
    }
    .pt-cell__chip {
      display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px;
      font-size: 0.75rem; border: 1px solid var(--platform-color-border, #e0e0e0);
    }
    .pt-cell__status { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem; }
    .pt-cell__status-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--platform-color-primary, #1976d2);
    }
    .pt-cell__tag {
      display: inline-flex; padding: 1px 6px; border-radius: 3px; font-size: 0.75rem;
      background: var(--platform-color-surface, #f5f5f5);
    }
    .pt-cell__icon { font-size: 1.1rem; }
    .pt-cell__rating { font-size: 0.875rem; }
  `],
})
export class TableCellComponent {
  private readonly cellRendererSvc = inject(TableCellRendererService);

  readonly node  = input.required<TableBodyCellNode>();
  readonly value = input<unknown>(undefined);

  readonly cellValue = computed(() =>
    this.cellRendererSvc.formatValue(this.value(), this.node()),
  );

  readonly rawNumber = computed(() => {
    const raw = this.value();
    return typeof raw === 'number' ? Math.min(100, Math.max(0, raw)) : 0;
  });
}
