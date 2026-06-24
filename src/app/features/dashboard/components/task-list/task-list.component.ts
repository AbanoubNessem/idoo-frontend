import {
  Component,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'done';

export interface TaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueLabel?: string;
}

/**
 * Task List — Dumb/Presentational.
 * Priority-badged list of tasks.
 */
@Component({
  selector: 'app-task-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="task-card" aria-label="My Tasks">
      <div class="task-card__header">
        <h2 class="task-card__title">My Tasks</h2>
        <span class="task-card__count">{{ tasks().length }} pending</span>
      </div>

      <div class="task-card__list" role="list">
        @for (task of tasks(); track task.id) {
          <div
            class="task-item"
            [class.task-item--done]="task.status === 'done'"
            role="listitem"
            [id]="'task-' + task.id"
          >
            <button
              class="task-item__check"
              [class.task-item__check--done]="task.status === 'done'"
              type="button"
              [attr.aria-label]="'Mark task as complete: ' + task.title"
            >
              @if (task.status === 'done') {
                <span class="sym">check_circle</span>
              } @else {
                <span class="sym">radio_button_unchecked</span>
              }
            </button>

            <div class="task-item__body">
              <span class="task-item__title">{{ task.title }}</span>
              @if (task.dueLabel) {
                <span class="task-item__due">{{ task.dueLabel }}</span>
              }
            </div>

            <span
              class="task-item__badge"
              [class]="'task-item__badge--' + task.priority"
            >{{ task.priority }}</span>
          </div>
        }

        @if (tasks().length === 0) {
          <div class="task-card__empty">
            <span class="sym">task_alt</span>
            <span>All caught up!</span>
          </div>
        }
      </div>

      <button class="task-card__add-btn" type="button" id="add-task-btn">
        <span class="sym">add</span>
        New Task
      </button>
    </article>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .task-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-1);
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      height: 100%;
    }

    .task-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .task-card__title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .task-card__count {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
    }

    /* ── List ── */
    .task-card__list {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
    }

    /* ── Item ── */
    .task-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      transition: background var(--transition-fast);

      &:hover { background: var(--color-background); }

      &--done {
        opacity: 0.55;
        .task-item__title { text-decoration: line-through; }
      }
    }

    .task-item__check {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: var(--color-text-tertiary);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      transition: color var(--transition-fast);

      &:hover { color: var(--color-primary); }
      &--done { color: var(--color-success); }

      .sym { font-size: 20px; }
    }

    .task-item__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .task-item__title {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .task-item__due {
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
    }

    /* ── Priority Badge ── */
    .task-item__badge {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-badge);
      padding: 2px 8px;
      text-transform: capitalize;
      white-space: nowrap;
      flex-shrink: 0;

      &--high   { background: var(--color-danger-bg);  color: var(--color-danger); }
      &--medium { background: var(--color-warning-bg); color: var(--color-warning); }
      &--low    { background: var(--color-success-bg); color: var(--color-success); }
    }

    /* ── Add Button ── */
    .task-card__add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      height: 36px;
      border: 1.5px dashed var(--color-border);
      border-radius: var(--radius-md);
      background: none;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
      flex-shrink: 0;

      &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
        background: var(--color-primary-light);
      }

      .sym { font-size: 18px; }
    }

    /* ── Empty ── */
    .task-card__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-8);
      color: var(--color-text-tertiary);
      font-size: var(--font-size-sm);

      .sym { font-size: 32px; color: var(--color-success); }
    }
  `],
})
export class TaskListComponent {
  readonly tasks = input<TaskItem[]>([]);
}
