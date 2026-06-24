import {
  Component,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';

export interface ActivityItem {
  id: string;
  user: string;
  userInitials: string;
  action: string;
  target?: string;
  timestamp: Date;
  icon: string;
  category: 'user' | 'company' | 'invoice' | 'system' | 'approval';
}

/**
 * Activity Timeline — Dumb/Presentational.
 * Vertical timeline of recent system events.
 */
@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="activity-card" aria-label="Recent Activities">
      <div class="activity-card__header">
        <h2 class="activity-card__title">Recent Activities</h2>
        <button class="activity-card__view-all" type="button">View all</button>
      </div>

      <div class="activity-card__list" role="list">
        @for (item of activities(); track item.id) {
          <div class="activity-item" role="listitem">
            <!-- Timeline line -->
            <div class="activity-item__timeline">
              <div
                class="activity-item__dot"
                [class]="'activity-item__dot--' + item.category"
              >
                <span class="sym">{{ item.icon }}</span>
              </div>
              @if (!$last) {
                <div class="activity-item__line"></div>
              }
            </div>

            <!-- Content -->
            <div class="activity-item__content">
              <div class="activity-item__header">
                <div class="activity-item__avatar" [attr.aria-label]="item.user">
                  {{ item.userInitials }}
                </div>
                <div class="activity-item__meta">
                  <span class="activity-item__user">{{ item.user }}</span>
                  <span class="activity-item__action">{{ item.action }}
                    @if (item.target) {
                      <strong>{{ item.target }}</strong>
                    }
                  </span>
                </div>
              </div>
              <span class="activity-item__time">{{ relativeTime(item.timestamp) }}</span>
            </div>
          </div>
        }

        @if (activities().length === 0) {
          <div class="activity-card__empty">
            <span class="sym">inbox</span>
            <span>No recent activity</span>
          </div>
        }
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .activity-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-1);
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      height: 100%;
      overflow: hidden;
    }

    .activity-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .activity-card__title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .activity-card__view-all {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-primary);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;

      &:hover { text-decoration: underline; }
    }

    /* ── List ── */
    .activity-card__list {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
      flex: 1;
    }

    /* ── Item ── */
    .activity-item {
      display: flex;
      gap: var(--space-3);
      min-height: 0;
    }

    /* ── Timeline Column ── */
    .activity-item__timeline {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      padding-bottom: var(--space-4);
    }

    .activity-item__dot {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .sym {
        font-size: 15px;
        font-variation-settings: 'FILL' 1;
      }

      &--user    { background: var(--color-primary-light); .sym { color: var(--color-primary-dark); } }
      &--company { background: var(--color-info-bg);       .sym { color: var(--color-info); } }
      &--invoice { background: var(--color-success-bg);    .sym { color: var(--color-success); } }
      &--system  { background: var(--color-warning-bg);    .sym { color: var(--color-warning); } }
      &--approval { background: var(--color-danger-bg);   .sym { color: var(--color-danger); } }
    }

    .activity-item__line {
      flex: 1;
      width: 1px;
      background: var(--color-border);
      margin: var(--space-1) 0;
    }

    /* ── Content Column ── */
    .activity-item__content {
      flex: 1;
      padding-bottom: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .activity-item__header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .activity-item__avatar {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-full);
      background: var(--color-border);
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-item__meta {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .activity-item__user {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .activity-item__action {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: var(--line-height-snug);

      strong {
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
      }
    }

    .activity-item__time {
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
    }

    /* ── Empty ── */
    .activity-card__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-8);
      color: var(--color-text-tertiary);
      font-size: var(--font-size-sm);

      .sym { font-size: 32px; }
    }
  `],
})
export class ActivityTimelineComponent {
  readonly activities = input<ActivityItem[]>([]);

  relativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffH = Math.floor(diffMins / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  }
}
