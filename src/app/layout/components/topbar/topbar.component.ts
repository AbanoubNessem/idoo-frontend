import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  computed,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../../../core/auth/state/auth.state';
import { AuthService } from '../../../core/auth/services/auth.service';

/**
 * Enterprise Topbar
 *
 * Left:  Logo + Hamburger toggle
 * Center: Global Search
 * Right:  Notifications · Messages · Help · User Profile
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  template: `
    <header class="topbar" role="banner">
      <!-- ── Left Zone ──────────────────────────── -->
      <div class="topbar__left">
        <button
          class="topbar__menu-btn"
          id="sidebar-toggle-btn"
          type="button"
          [attr.aria-expanded]="!sidebarCollapsed()"
          aria-label="Toggle sidebar"
          (click)="toggleSidebar.emit()"
        >
          <span class="sym">{{ sidebarCollapsed() ? 'menu' : 'menu_open' }}</span>
        </button>

        <a routerLink="/app/dashboard" class="topbar__brand" aria-label="iDoo ERP Home">
          <span class="topbar__brand-logo">
            <span class="sym">hub</span>
          </span>
          <span class="topbar__brand-name">
            iDoo <span class="topbar__brand-erp">ERP</span>
          </span>
        </a>
      </div>

      <!-- ── Center: Search ─────────────────────── -->
      <div class="topbar__center">
        <div class="topbar__search">
          <span class="topbar__search-icon sym">search</span>
          <input
            id="global-search"
            type="search"
            class="topbar__search-input"
            placeholder="Search anything..."
            autocomplete="off"
            aria-label="Global search"
          />
          <kbd class="topbar__search-kbd">⌘K</kbd>
        </div>
      </div>

      <!-- ── Right: Actions + Profile ─────────────── -->
      <div class="topbar__right">
        <button class="topbar__icon-btn" id="notifications-btn" type="button" aria-label="Notifications">
          <span class="sym">notifications</span>
          <span class="topbar__badge" aria-label="3 unread notifications">3</span>
        </button>

        <button class="topbar__icon-btn" id="messages-btn" type="button" aria-label="Messages">
          <span class="sym">mark_unread_chat_alt</span>
          <span class="topbar__badge topbar__badge--warn" aria-label="5 unread messages">5</span>
        </button>

        <button class="topbar__icon-btn" id="help-btn" type="button" aria-label="Help and support">
          <span class="sym">help_outline</span>
        </button>

        <div class="topbar__divider" role="separator"></div>

        <div class="topbar__profile" id="profile-menu" tabindex="0" role="button" aria-label="User menu"
          (click)="profileOpen.update(v => !v)"
          (keydown.enter)="profileOpen.update(v => !v)"
          (keydown.space)="profileOpen.update(v => !v)">
          <div class="topbar__avatar" aria-hidden="true">
            {{ userInitials() }}
          </div>
          <div class="topbar__user-info">
            <span class="topbar__user-name">{{ userName() }}</span>
            <span class="topbar__user-role">System Administrator</span>
          </div>
          <span class="sym topbar__chevron" [class.topbar__chevron--open]="profileOpen()">
            expand_more
          </span>

          @if (profileOpen()) {
            <div class="topbar__dropdown" role="menu" (click)="$event.stopPropagation()">
              <div class="topbar__dropdown-header">
                <div class="topbar__dropdown-avatar">{{ userInitials() }}</div>
                <div>
                  <div class="topbar__dropdown-name">{{ userName() }}</div>
                  <div class="topbar__dropdown-email">{{ userEmail() }}</div>
                </div>
              </div>
              <div class="topbar__dropdown-divider"></div>
              <button class="topbar__dropdown-item" role="menuitem" type="button">
                <span class="sym">manage_accounts</span> My Profile
              </button>
              <button class="topbar__dropdown-item" role="menuitem" type="button">
                <span class="sym">settings</span> Settings
              </button>
              <div class="topbar__dropdown-divider"></div>
              <button class="topbar__dropdown-item topbar__dropdown-item--danger" role="menuitem"
                type="button" (click)="onLogout()">
                <span class="sym">logout</span> Sign Out
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }

    .topbar {
      height: var(--header-height);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: 0 var(--space-6);
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
    }

    /* ── Left ── */
    .topbar__left {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-shrink: 0;
    }

    .topbar__menu-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      transition: background var(--transition-fast), color var(--transition-fast);
      cursor: pointer;

      &:hover {
        background: var(--color-surface-hover);
        color: var(--color-text-primary);
      }

      .sym { font-size: 22px; }
    }

    .topbar__brand {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;
      color: inherit;
    }

    .topbar__brand-logo {
      width: 36px;
      height: 36px;
      background: var(--color-primary);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;

      .sym {
        font-size: 20px;
        color: white;
        font-variation-settings: 'FILL' 1;
      }
    }

    .topbar__brand-name {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      letter-spacing: -0.3px;
    }

    .topbar__brand-erp {
      color: var(--color-primary);
    }

    /* ── Center ── */
    .topbar__center {
      flex: 1;
      max-width: 480px;
      margin: 0 auto;
    }

    .topbar__search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .topbar__search-icon {
      position: absolute;
      left: var(--space-3);
      color: var(--color-text-tertiary);
      font-size: 18px;
      pointer-events: none;
    }

    .topbar__search-input {
      width: 100%;
      height: 40px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-input);
      background: var(--color-background);
      padding: 0 var(--space-10) 0 var(--space-10);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
      outline: none;

      &::placeholder { color: var(--color-text-tertiary); }

      &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.12);
        background: var(--color-surface);
      }
    }

    .topbar__search-kbd {
      position: absolute;
      right: var(--space-3);
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
      background: var(--color-surface-hover);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xs);
      padding: 2px 6px;
      font-family: var(--font-family);
    }

    /* ── Right ── */
    .topbar__right {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      flex-shrink: 0;
      margin-left: auto;
    }

    .topbar__icon-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      cursor: pointer;
      position: relative;
      transition: background var(--transition-fast), color var(--transition-fast);

      &:hover {
        background: var(--color-surface-hover);
        color: var(--color-text-primary);
      }

      .sym { font-size: 22px; }
    }

    .topbar__badge {
      position: absolute;
      top: 6px;
      right: 6px;
      min-width: 16px;
      height: 16px;
      border-radius: var(--radius-full);
      background: var(--color-danger);
      color: white;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      line-height: 1;
      border: 1.5px solid var(--color-surface);

      &--warn { background: var(--color-warning); }
    }

    .topbar__divider {
      width: 1px;
      height: 28px;
      background: var(--color-border);
      margin: 0 var(--space-2);
    }

    .topbar__profile {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      cursor: pointer;
      position: relative;
      transition: background var(--transition-fast);
      outline: none;

      &:hover { background: var(--color-surface-hover); }
      &:focus-visible {
        box-shadow: 0 0 0 2px var(--color-primary);
      }
    }

    .topbar__avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: var(--color-primary);
      color: var(--color-text-inverse);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.5px;
    }

    .topbar__user-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .topbar__user-name {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    .topbar__user-role {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    .topbar__chevron {
      font-size: 18px;
      color: var(--color-text-secondary);
      transition: transform var(--transition-base);

      &--open { transform: rotate(180deg); }
    }

    /* ── Dropdown ── */
    .topbar__dropdown {
      position: absolute;
      top: calc(100% + var(--space-2));
      right: 0;
      min-width: 240px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-3);
      z-index: var(--z-dropdown);
      overflow: hidden;
      animation: dropdownIn 150ms ease;
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .topbar__dropdown-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
    }

    .topbar__dropdown-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--color-primary);
      color: white;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .topbar__dropdown-name {
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
    }

    .topbar__dropdown-email {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-top: 1px;
    }

    .topbar__dropdown-divider {
      height: 1px;
      background: var(--color-border);
      margin: 0;
    }

    .topbar__dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border: none;
      background: transparent;
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background var(--transition-fast);
      text-align: left;

      &:hover { background: var(--color-surface-hover); }

      .sym { font-size: 18px; color: var(--color-text-secondary); }

      &--danger {
        color: var(--color-danger);
        .sym { color: var(--color-danger); }
        &:hover { background: var(--color-danger-bg); }
      }
    }

    /* ── Responsive ── */
    @media (max-width: 767px) {
      .topbar__center { display: none; }
      .topbar__user-info { display: none; }
      .topbar__chevron { display: none; }
    }
  `],
})
export class TopbarComponent {
  readonly sidebarCollapsed = input(false);
  readonly toggleSidebar = output<void>();

  private readonly authState = inject(AuthStateService);
  private readonly authService = inject(AuthService);

  readonly profileOpen = signal(false);

  readonly userName = computed(() => this.authState.user()?.fullName ?? 'Abanoub Girgis');
  readonly userEmail = computed(() => this.authState.user()?.email ?? '');
  readonly userInitials = computed(() => {
    const name = this.userName();
    const parts = name.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  });

  onLogout(): void {
    this.authService.logout();
  }
}
