import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { ContextFacade } from '../../../core/context/context.facade';
import { AuthStateService } from '../../../core/auth/state/auth.state';

/**
 * Context Bar — Always visible, Multi-Tenant awareness strip.
 * Shows: Tenant · Company · Branch
 * Right: Switch Context button
 */
@Component({
  selector: 'app-context-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ctx-bar" role="complementary" aria-label="Current workspace context">
      <div class="ctx-bar__items">
        <div class="ctx-bar__item">
          <span class="sym ctx-bar__item-icon">domain</span>
          <span class="ctx-bar__item-label">Tenant</span>
          <span class="ctx-bar__item-value">
            {{ tenantName() }}
          </span>
        </div>

        <span class="ctx-bar__separator" aria-hidden="true">›</span>

        <div class="ctx-bar__item">
          <span class="sym ctx-bar__item-icon">business</span>
          <span class="ctx-bar__item-label">Company</span>
          <span class="ctx-bar__item-value">
            {{ companyName() }}
          </span>
        </div>

        <span class="ctx-bar__separator" aria-hidden="true">›</span>

        <div class="ctx-bar__item">
          <span class="sym ctx-bar__item-icon">account_tree</span>
          <span class="ctx-bar__item-label">Branch</span>
          <span class="ctx-bar__item-value">
            {{ branchName() }}
          </span>
        </div>
      </div>

      <div class="ctx-bar__actions">
        <span class="ctx-bar__fiscal">
          <span class="sym" style="font-size:14px;">calendar_today</span>
          FY 2026
        </span>
        <button
          class="ctx-bar__switch-btn"
          id="switch-context-btn"
          type="button"
          aria-label="Switch workspace context"
        >
          <span class="sym">swap_horiz</span>
          Switch Context
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .ctx-bar {
      height: var(--context-bar-height);
      background: var(--color-context-bg);
      border-bottom: 1px solid var(--color-context-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-6);
      gap: var(--space-4);
    }

    .ctx-bar__items {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .ctx-bar__item {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      white-space: nowrap;
    }

    .ctx-bar__item-icon {
      font-size: 14px;
      color: var(--color-context-text);
      font-variation-settings: 'FILL' 0;
    }

    .ctx-bar__item-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-context-text);
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .ctx-bar__item-value {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-context-text);
    }

    .ctx-bar__separator {
      color: var(--color-context-text);
      opacity: 0.4;
      font-size: var(--font-size-lg);
      user-select: none;
    }

    .ctx-bar__actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-shrink: 0;
    }

    .ctx-bar__fiscal {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-context-text);
      opacity: 0.8;
    }

    .ctx-bar__switch-btn {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      height: 28px;
      padding: 0 var(--space-3);
      border: 1.5px solid var(--color-context-border);
      border-radius: var(--radius-button);
      background: var(--color-surface);
      color: var(--color-context-text);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: background var(--transition-fast), box-shadow var(--transition-fast);

      &:hover {
        background: var(--color-primary-light);
        box-shadow: var(--shadow-1);
      }

      .sym { font-size: 16px; }
    }

    /* ── Responsive ── */
    @media (max-width: 767px) {
      .ctx-bar {
        padding: 0 var(--space-4);
        gap: var(--space-2);
      }

      .ctx-bar__item-label { display: none; }
      .ctx-bar__fiscal { display: none; }

      .ctx-bar__switch-btn {
        font-size: 0;
        padding: 0 var(--space-2);
        .sym { font-size: 18px; }
      }
    }

    @media (max-width: 480px) {
      .ctx-bar__separator { display: none; }
    }
  `],
})
export class ContextBarComponent {
  private readonly contextFacade = inject(ContextFacade);
  private readonly authState = inject(AuthStateService);

  readonly tenantName = computed(() =>
    this.contextFacade.currentTenant()?.name ?? 'SYSTEM'
  );
  readonly companyName = computed(() =>
    this.contextFacade.currentCompany()?.name ?? 'Main Company'
  );
  readonly branchName = computed(() =>
    this.contextFacade.currentBranch()?.name ?? 'Cairo Branch'
  );
}
