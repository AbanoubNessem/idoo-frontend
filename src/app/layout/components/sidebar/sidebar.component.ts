import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
  OnInit,
  computed,
} from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

/**
 * Enterprise Sidebar — Collapsible, grouped navigation.
 *
 * Features:
 *  - Icon + label layout (label hides when collapsed)
 *  - Section groupings
 *  - Active state via routerLinkActive
 *  - Collapse toggle emitted to parent Shell
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  template: `
    <nav
      class="sidebar"
      [class.sidebar--collapsed]="collapsed()"
      role="navigation"
      aria-label="Main navigation"
    >
      <!-- ── Collapse Toggle ─────────────────── -->
      <div class="sidebar__collapse-bar">
        <button
          class="sidebar__collapse-btn"
          type="button"
          [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          (click)="collapse.emit(!collapsed())"
        >
          <span class="sym sidebar__collapse-icon">
            {{ collapsed() ? 'chevron_right' : 'chevron_left' }}
          </span>
        </button>
      </div>

      <!-- ── Navigation Sections ─────────────── -->
      <div class="sidebar__scroll">
        @for (section of navSections; track section.id) {
          <div class="sidebar__section">
            @if (!collapsed()) {
              <span class="sidebar__section-label">{{ section.label }}</span>
            }

            @for (item of section.items; track item.id) {
              <a
                [id]="'nav-' + item.id"
                [routerLink]="item.route"
                routerLinkActive="sidebar__link--active"
                class="sidebar__link"
                [attr.aria-label]="collapsed() ? item.label : null"
                [title]="collapsed() ? item.label : ''"
              >
                <span class="sym sidebar__link-icon">{{ item.icon }}</span>
                @if (!collapsed()) {
                  <span class="sidebar__link-label">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="sidebar__link-badge">{{ item.badge }}</span>
                  }
                }
              </a>
            }
          </div>
        }
      </div>

      <!-- ── Bottom Settings ─────────────────── -->
      <div class="sidebar__bottom">
        <a
          id="nav-settings"
          routerLink="/app/settings"
          routerLinkActive="sidebar__link--active"
          class="sidebar__link"
          [attr.aria-label]="collapsed() ? 'Settings' : null"
          [title]="collapsed() ? 'Settings' : ''"
        >
          <span class="sym sidebar__link-icon">settings</span>
          @if (!collapsed()) {
            <span class="sidebar__link-label">Settings</span>
          }
        </a>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .sidebar {
      height: 100%;
      width: var(--sidebar-width);
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width var(--transition-layout);

      &--collapsed {
        width: var(--sidebar-collapsed-w);
      }
    }

    /* ── Collapse bar ── */
    .sidebar__collapse-bar {
      display: flex;
      justify-content: flex-end;
      padding: var(--space-2) var(--space-2) var(--space-1);
      border-bottom: 1px solid var(--color-border);
    }

    .sidebar__collapse-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-tertiary);
      transition: background var(--transition-fast), color var(--transition-fast);

      &:hover {
        background: var(--color-surface-hover);
        color: var(--color-text-primary);
      }
    }

    .sidebar__collapse-icon {
      font-size: 18px;
    }

    /* ── Scroll area ── */
    .sidebar__scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--space-2) 0;
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
    }

    /* ── Section ── */
    .sidebar__section {
      margin-bottom: var(--space-2);
      padding: 0 var(--space-2);
    }

    .sidebar__section-label {
      display: block;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: var(--space-3) var(--space-2) var(--space-1);
      white-space: nowrap;
    }

    /* ── Nav Link ── */
    .sidebar__link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      height: 40px;
      padding: 0 var(--space-2);
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      transition: background var(--transition-fast), color var(--transition-fast);
      white-space: nowrap;
      overflow: hidden;
      position: relative;

      &:hover {
        background: var(--color-surface-hover);
        color: var(--color-text-primary);
      }

      &--active {
        background: var(--color-primary-light);
        color: var(--color-primary-dark);
        font-weight: var(--font-weight-semibold);

        .sidebar__link-icon {
          color: var(--color-primary);
          font-variation-settings: 'FILL' 1;
        }
      }
    }

    .sidebar__link-icon {
      font-size: 20px;
      flex-shrink: 0;
      width: 20px;
      transition: color var(--transition-fast);
    }

    .sidebar__link-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar__link-badge {
      background: var(--color-danger);
      color: white;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      border-radius: var(--radius-full);
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      flex-shrink: 0;
    }

    /* ── Bottom ── */
    .sidebar__bottom {
      padding: var(--space-2);
      border-top: 1px solid var(--color-border);
    }

    /* ── Collapsed state ── */
    .sidebar--collapsed {
      .sidebar__link {
        justify-content: center;
        padding: 0;
        width: 44px;
        height: 44px;
        margin: 0 auto var(--space-1);
      }

      .sidebar__section { padding: 0 var(--space-2); }
      .sidebar__bottom { padding: var(--space-2); }
    }

    /* ── Responsive ── */
    @media (max-width: 767px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: calc(var(--header-height) + var(--context-bar-height));
        height: calc(100vh - var(--header-height) - var(--context-bar-height));
        z-index: var(--z-fixed);
        box-shadow: var(--shadow-3);
      }
    }
  `],
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly collapse = output<boolean>();

  readonly navSections: NavSection[] = [
    {
      id: 'main',
      label: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' },
      ],
    },
    {
      id: 'administration',
      label: 'Administration',
      items: [
        { id: 'users', label: 'Users', icon: 'group', route: '/app/users' },
        { id: 'roles', label: 'Roles', icon: 'shield', route: '/app/roles' },
        { id: 'permissions', label: 'Permissions', icon: 'lock', route: '/app/permissions' },
      ],
    },
    {
      id: 'organization',
      label: 'Organization',
      items: [
        { id: 'tenants', label: 'Tenants', icon: 'domain', route: '/app/tenants' },
        { id: 'companies', label: 'Companies', icon: 'business', route: '/app/companies' },
        { id: 'branches', label: 'Branches', icon: 'account_tree', route: '/app/branches' },
        { id: 'departments', label: 'Departments', icon: 'corporate_fare', route: '/app/departments' },
      ],
    },
    {
      id: 'modules',
      label: 'Modules',
      items: [
        { id: 'gl', label: 'General Ledger', icon: 'receipt_long', route: '/app/gl' },
        { id: 'fleet', label: 'Fleet', icon: 'directions_car', route: '/app/fleet' },
        { id: 'hr', label: 'Human Resources', icon: 'badge', route: '/app/hr' },
        { id: 'inventory', label: 'Inventory', icon: 'inventory_2', route: '/app/inventory' },
        { id: 'crm', label: 'CRM', icon: 'contacts', route: '/app/crm' },
        { id: 'purchasing', label: 'Purchasing', icon: 'shopping_cart', route: '/app/purchasing' },
        { id: 'sales', label: 'Sales', icon: 'point_of_sale', route: '/app/sales' },
        { id: 'reports', label: 'Reports', icon: 'bar_chart', route: '/app/reports' },
      ],
    },
  ];
}
