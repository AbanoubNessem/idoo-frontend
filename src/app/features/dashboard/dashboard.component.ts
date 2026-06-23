import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Overview of your ERP metrics</p>
    </div>

    <div class="dashboard-grid">
      <!-- KPI Cards -->
      <div class="kpi-card">
        <div class="kpi-icon domain">domain</div>
        <div class="kpi-content">
          <h3>Tenants</h3>
          <div class="kpi-value">12</div>
          <div class="kpi-subtext">Active Tenants</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon business">business</div>
        <div class="kpi-content">
          <h3>Companies</h3>
          <div class="kpi-value">24</div>
          <div class="kpi-subtext">Active Companies</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon group">group</div>
        <div class="kpi-content">
          <h3>Users</h3>
          <div class="kpi-value">156</div>
          <div class="kpi-subtext">Total Users</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon security">security</div>
        <div class="kpi-content">
          <h3>Roles</h3>
          <div class="kpi-value">18</div>
          <div class="kpi-subtext">Total Roles</div>
        </div>
      </div>

      <!-- Chart Area -->
      <div class="chart-widget">
        <div class="widget-header">
          <h3>Users Over Time</h3>
        </div>
        <div class="widget-body">
          <div class="chart-placeholder">
            [Chart Area Placeholder]
          </div>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="activity-widget">
        <div class="widget-header">
          <h3>Recent Activities</h3>
        </div>
        <div class="widget-body">
          <ul class="activity-list">
            <li>
              <div class="activity-icon">person_add</div>
              <div class="activity-details">
                <span class="action">New user created</span>
                <span class="entity">Mary Smith</span>
              </div>
              <div class="activity-time">10m ago</div>
            </li>
            <li>
              <div class="activity-icon">edit_note</div>
              <div class="activity-details">
                <span class="action">Role updated</span>
                <span class="entity">Finance Manager</span>
              </div>
              <div class="activity-time">25m ago</div>
            </li>
            <li>
              <div class="activity-icon">business_center</div>
              <div class="activity-details">
                <span class="action">Company created</span>
                <span class="entity">ABC Trading</span>
              </div>
              <div class="activity-time">1h ago</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      margin-bottom: var(--spacing-6);
    }
    .dashboard-header p {
      color: var(--color-text-secondary);
      margin-top: var(--spacing-1);
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-6);
    }
    .kpi-card {
      background-color: var(--color-background);
      border-radius: var(--radius-md);
      padding: var(--spacing-4);
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
      box-shadow: var(--shadow-1);
      border: 1px solid var(--color-border);
    }
    .kpi-icon {
      font-family: 'Material Symbols Outlined';
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .kpi-icon.domain { background: var(--color-primary-light); color: var(--color-primary-dark); }
    .kpi-icon.business { background: var(--color-info-bg); color: var(--color-info); }
    .kpi-icon.group { background: var(--color-success-bg); color: var(--color-success); }
    .kpi-icon.security { background: var(--color-warning-bg); color: var(--color-warning); }
    
    .kpi-content h3 {
      font-size: 14px;
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: var(--spacing-1) 0;
    }
    .kpi-subtext {
      font-size: 12px;
      color: var(--color-text-tertiary);
    }

    .chart-widget {
      grid-column: span 3;
      background-color: var(--color-background);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-1);
      border: 1px solid var(--color-border);
    }
    .activity-widget {
      grid-column: span 1;
      background-color: var(--color-background);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-1);
      border: 1px solid var(--color-border);
    }

    .widget-header {
      padding: var(--spacing-4);
      border-bottom: 1px solid var(--color-border);
    }
    .widget-header h3 {
      font-size: 16px;
    }
    .widget-body {
      padding: var(--spacing-4);
    }
    .chart-placeholder {
      height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-surface);
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      border: 1px dashed var(--color-border-hover);
    }

    .activity-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
    }
    .activity-list li {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-3);
    }
    .activity-icon {
      font-family: 'Material Symbols Outlined';
      color: var(--color-primary);
      background-color: var(--color-primary-light);
      padding: var(--spacing-2);
      border-radius: var(--radius-full);
      font-size: 16px;
    }
    .activity-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .activity-details .action {
      font-size: 14px;
      font-weight: 500;
    }
    .activity-details .entity {
      font-size: 12px;
      color: var(--color-text-secondary);
    }
    .activity-time {
      font-size: 12px;
      color: var(--color-text-tertiary);
    }
  `]
})
export class DashboardComponent {}
