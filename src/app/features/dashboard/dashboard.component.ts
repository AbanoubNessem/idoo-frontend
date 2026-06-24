import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  OnInit,
} from '@angular/core';
import { AuthStateService } from '../../core/auth/state/auth.state';

// Sub-components
import { WelcomeSectionComponent } from './components/welcome-section/welcome-section.component';
import { KpiCardComponent, KpiCardData } from './components/kpi-card/kpi-card.component';
import { RevenueChartComponent } from './components/revenue-chart/revenue-chart.component';
import { QuickActionsComponent, QuickAction } from './components/quick-actions/quick-actions.component';
import { ActivityTimelineComponent, ActivityItem } from './components/activity-timeline/activity-timeline.component';
import { TaskListComponent, TaskItem } from './components/task-list/task-list.component';
import { ModuleCardComponent, ModuleCard } from './components/module-card/module-card.component';

// ── Static data (would come from services in production) ─────────────────────

const KPI_DATA: KpiCardData[] = [
  {
    id: 'companies',
    title: 'Companies',
    value: 12,
    growth: '+2 this month',
    growthDirection: 'up',
    icon: 'business',
    iconColor: 'primary',
  },
  {
    id: 'branches',
    title: 'Branches',
    value: 43,
    growth: '+5 this month',
    growthDirection: 'up',
    icon: 'account_tree',
    iconColor: 'info',
  },
  {
    id: 'users',
    title: 'Users',
    value: 384,
    growth: '+18 this month',
    growthDirection: 'up',
    icon: 'group',
    iconColor: 'success',
  },
  {
    id: 'active-users',
    title: 'Active Users',
    value: 368,
    growth: '+12 this month',
    growthDirection: 'up',
    icon: 'person_check',
    iconColor: 'warning',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'add-user',       icon: 'person_add',    label: 'Add User',       color: 'primary', route: '/app/users/new' },
  { id: 'add-company',    icon: 'add_business',  label: 'Add Company',    color: 'info',    route: '/app/companies/new' },
  { id: 'add-branch',     icon: 'add_location',  label: 'Add Branch',     color: 'success', route: '/app/branches/new' },
  { id: 'create-invoice', icon: 'receipt_long',  label: 'Create Invoice', color: 'warning', route: '/app/gl/invoices/new' },
  { id: 'view-reports',   icon: 'bar_chart',     label: 'View Reports',   color: 'danger',  route: '/app/reports' },
  { id: 'settings',       icon: 'settings',      label: 'Settings',       color: 'primary', route: '/app/settings' },
];

const now = new Date();
const min = (m: number) => new Date(now.getTime() - m * 60_000);
const hr  = (h: number) => new Date(now.getTime() - h * 3_600_000);

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'a1',
    user: 'John Smith',
    userInitials: 'JS',
    action: 'created a new user',
    target: 'Mary Johnson',
    timestamp: min(2),
    icon: 'person_add',
    category: 'user',
  },
  {
    id: 'a2',
    user: 'Admin',
    userInitials: 'AD',
    action: 'added a branch',
    target: 'Alexandria Branch',
    timestamp: min(25),
    icon: 'add_location',
    category: 'company',
  },
  {
    id: 'a3',
    user: 'Finance',
    userInitials: 'FN',
    action: 'approved invoice',
    target: 'INV-2026-0482',
    timestamp: hr(1),
    icon: 'task_alt',
    category: 'invoice',
  },
  {
    id: 'a4',
    user: 'Abanoub Girgis',
    userInitials: 'AG',
    action: 'updated profile settings',
    timestamp: hr(2),
    icon: 'manage_accounts',
    category: 'user',
  },
  {
    id: 'a5',
    user: 'System',
    userInitials: 'SY',
    action: 'backup completed successfully',
    timestamp: hr(3),
    icon: 'backup',
    category: 'system',
  },
  {
    id: 'a6',
    user: 'Nada Hassan',
    userInitials: 'NH',
    action: 'submitted a purchase request',
    target: '#PR-1043',
    timestamp: hr(5),
    icon: 'shopping_cart',
    category: 'approval',
  },
];

const TASKS: TaskItem[] = [
  { id: 't1', title: 'Approve Purchase Request', priority: 'high',   status: 'pending',     dueLabel: 'Due today' },
  { id: 't2', title: 'Review Q2 Budget',          priority: 'high',   status: 'pending',     dueLabel: 'Due tomorrow' },
  { id: 't3', title: 'Complete Profile Setup',    priority: 'medium', status: 'in-progress', dueLabel: 'Due this week' },
  { id: 't4', title: 'Pending Approvals (3)',     priority: 'medium', status: 'pending' },
  { id: 't5', title: 'Update Fleet Records',      priority: 'low',    status: 'pending',     dueLabel: 'Due Jun 30' },
  { id: 't6', title: 'Onboard New Employees',     priority: 'low',    status: 'done' },
];

const MODULES: ModuleCard[] = [
  {
    id: 'gl',
    icon: 'receipt_long',
    shortName: 'GL',
    fullName: 'General Ledger',
    description: 'Chart of accounts, journals & reports',
    route: '/app/gl',
    color: 'primary',
    enabled: true,
  },
  {
    id: 'fleet',
    icon: 'directions_car',
    shortName: 'Fleet',
    fullName: 'Fleet Management',
    description: 'Vehicles, maintenance & tracking',
    route: '/app/fleet',
    color: 'info',
    enabled: true,
  },
  {
    id: 'hr',
    icon: 'badge',
    shortName: 'HR',
    fullName: 'Human Resources',
    description: 'Employees, payroll & attendance',
    route: '/app/hr',
    color: 'success',
    enabled: true,
  },
  {
    id: 'inventory',
    icon: 'inventory_2',
    shortName: 'INV',
    fullName: 'Inventory',
    description: 'Stock, warehouses & movements',
    route: '/app/inventory',
    color: 'warning',
    enabled: true,
  },
  {
    id: 'crm',
    icon: 'contacts',
    shortName: 'CRM',
    fullName: 'Customer Relationship',
    description: 'Leads, contacts & opportunities',
    route: '/app/crm',
    color: 'danger',
    enabled: false,
  },
  {
    id: 'purchasing',
    icon: 'shopping_cart',
    shortName: 'PO',
    fullName: 'Purchasing',
    description: 'Purchase orders & vendors',
    route: '/app/purchasing',
    color: 'purple',
    enabled: false,
  },
  {
    id: 'sales',
    icon: 'point_of_sale',
    shortName: 'Sales',
    fullName: 'Sales',
    description: 'Quotations, orders & invoicing',
    route: '/app/sales',
    color: 'success',
    enabled: false,
  },
  {
    id: 'reports',
    icon: 'bar_chart',
    shortName: 'RPT',
    fullName: 'Reports & Analytics',
    description: 'Dashboards, KPIs & data exports',
    route: '/app/reports',
    color: 'info',
    enabled: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dashboard — Smart (Container) Component.
 *
 * Responsibilities:
 *  - Compose all dashboard sub-components.
 *  - Provide data (signals / computed) to dumb children.
 *  - No layout concerns inside children.
 *
 * Layout:
 *  Welcome Section
 *  ── KPI Row (4 cards)
 *  ── Revenue (70%) | Quick Actions (30%)
 *  ── Activities (50%) | Tasks (50%)
 *  ── Modules Grid (8 cards, 4-col)
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WelcomeSectionComponent,
    KpiCardComponent,
    RevenueChartComponent,
    QuickActionsComponent,
    ActivityTimelineComponent,
    TaskListComponent,
    ModuleCardComponent,
  ],
  template: `
    <div class="dashboard" id="dashboard-root" role="main" aria-label="Main Dashboard">

      <!-- ── Welcome Section ──────────────────── -->
      <app-welcome-section [userName]="userName()" />

      <!-- ── KPI Row ──────────────────────────── -->
      <section class="dashboard__kpi-row" aria-label="Key Performance Indicators">
        @for (kpi of kpis; track kpi.id) {
          <app-kpi-card [data]="kpi" />
        }
      </section>

      <!-- ── Chart + Quick Actions Row ───────── -->
      <section class="dashboard__chart-row" aria-label="Revenue and Quick Actions">
        <div class="dashboard__chart-cell">
          <app-revenue-chart />
        </div>
        <div class="dashboard__qa-cell">
          <app-quick-actions [actions]="quickActions" />
        </div>
      </section>

      <!-- ── Activities + Tasks Row ───────────── -->
      <section class="dashboard__mid-row" aria-label="Activities and Tasks">
        <div class="dashboard__activity-cell">
          <app-activity-timeline [activities]="activities" />
        </div>
        <div class="dashboard__tasks-cell">
          <app-task-list [tasks]="tasks" />
        </div>
      </section>

      <!-- ── Modules Grid ──────────────────────── -->
      <section class="dashboard__modules-section" aria-label="ERP Modules">
        <div class="dashboard__section-header">
          <h2 class="dashboard__section-title">ERP Modules</h2>
          <span class="dashboard__section-subtitle">Click a module to navigate</span>
        </div>
        <div class="dashboard__modules-grid">
          @for (mod of modules; track mod.id) {
            <app-module-card [card]="mod" />
          }
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; width: 100%; }

    .dashboard {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      max-width: var(--content-max-width);
      margin: 0 auto;
      padding-bottom: var(--space-8);
      min-width: 0;
      width: 100%;
    }

    /* ── KPI Row ── */
    .dashboard__kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-5);
    }

    /* ── Chart + QA Row ── */
    .dashboard__chart-row {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: var(--space-5);
      align-items: stretch;
      min-height: 360px;
    }

    .dashboard__chart-cell,
    .dashboard__qa-cell {
      display: flex;
      flex-direction: column;
    }

    /* ── Activities + Tasks Row ── */
    .dashboard__mid-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-5);
      min-height: 340px;
      align-items: stretch;
    }

    .dashboard__activity-cell,
    .dashboard__tasks-cell {
      display: flex;
      flex-direction: column;
    }

    /* ── Modules Section ── */
    .dashboard__modules-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .dashboard__section-header {
      display: flex;
      align-items: baseline;
      gap: var(--space-3);
    }

    .dashboard__section-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .dashboard__section-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .dashboard__modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--space-4);
    }

    /* ── Responsive: Tablet (768–1024) ── */
    @media (max-width: 1024px) {
      .dashboard__kpi-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .dashboard__chart-row {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .dashboard__modules-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* ── Responsive: Mobile (<768) ── */
    @media (max-width: 767px) {
      .dashboard {
        gap: var(--space-4);
      }

      .dashboard__kpi-row {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-3);
      }

      .dashboard__chart-row {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .dashboard__mid-row {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .dashboard__modules-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly authState = inject(AuthStateService);

  ngOnInit() {
    console.log('DashboardComponent Loaded');
  }

  /* ── Data exposed to template ────────────────────────────────────────────── */
  readonly userName = computed(() =>
    this.authState.user()?.fullName ?? 'Abanoub Girgis'
  );

  readonly kpis = KPI_DATA;
  readonly quickActions = QUICK_ACTIONS;
  readonly activities = ACTIVITIES;
  readonly tasks = TASKS;
  readonly modules = MODULES;
}
