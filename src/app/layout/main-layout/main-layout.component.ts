import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="main-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="brand-logo">iDoo <span>ERP</span></h1>
        </div>
        <nav class="sidebar-nav">
          <ul>
            <li><a routerLink="/dashboard" routerLinkActive="active"><span class="icon">dashboard</span> Dashboard</a></li>
            <li><a routerLink="/users" routerLinkActive="active"><span class="icon">group</span> Users</a></li>
            <li><a routerLink="/roles" routerLinkActive="active"><span class="icon">security</span> Roles</a></li>
            <li><a routerLink="/companies" routerLinkActive="active"><span class="icon">business</span> Companies</a></li>
            <li><a routerLink="/branches" routerLinkActive="active"><span class="icon">account_tree</span> Branches</a></li>
            <li><a routerLink="/departments" routerLinkActive="active"><span class="icon">corporate_fare</span> Departments</a></li>
          </ul>
        </nav>
      </aside>

      <div class="main-content-wrapper">
        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <div class="search-bar">
              <span class="search-icon">search</span>
              <input type="text" placeholder="Search anything..." />
            </div>
          </div>
          <div class="topbar-right">
            <div class="context-switcher">
              <span>Tenant: IDOO</span> | <span>Branch: Head Office</span>
            </div>
            <button class="icon-btn"><span class="icon">notifications</span></button>
            <div class="user-menu">
              <div class="avatar">JD</div>
              <span class="user-name">John Doe</span>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--color-surface);
    }
    .sidebar {
      width: 260px;
      background-color: var(--color-background);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: var(--spacing-6) var(--spacing-4);
      border-bottom: 1px solid var(--color-border);
    }
    .brand-logo {
      color: var(--color-primary);
      font-size: 24px;
      margin: 0;
    }
    .brand-logo span {
      color: var(--color-text-secondary);
      font-weight: 400;
    }
    .sidebar-nav {
      padding: var(--spacing-4) 0;
      flex: 1;
    }
    .sidebar-nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .sidebar-nav li {
      margin-bottom: var(--spacing-1);
    }
    .sidebar-nav a {
      display: flex;
      align-items: center;
      padding: var(--spacing-3) var(--spacing-4);
      color: var(--color-text-secondary);
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.2s, color 0.2s;
    }
    .sidebar-nav a:hover {
      background-color: var(--color-surface-hover);
      color: var(--color-primary);
    }
    .sidebar-nav a.active {
      background-color: var(--color-primary-light);
      color: var(--color-primary-dark);
      border-right: 3px solid var(--color-primary);
    }
    .icon {
      /* Material icon placeholder */
      font-family: 'Material Symbols Outlined';
      margin-right: var(--spacing-3);
      font-size: 20px;
    }
    .main-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      height: 64px;
      background-color: var(--color-background);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--spacing-6);
    }
    .search-bar {
      display: flex;
      align-items: center;
      background-color: var(--color-surface);
      border-radius: var(--radius-md);
      padding: 0 var(--spacing-3);
      width: 300px;
    }
    .search-bar input {
      border: none;
      background: transparent;
      padding: var(--spacing-2);
      width: 100%;
      outline: none;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
    }
    .context-switcher {
      font-size: 14px;
      color: var(--color-text-secondary);
      padding-right: var(--spacing-4);
      border-right: 1px solid var(--color-border);
    }
    .icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      cursor: pointer;
    }
    .avatar {
      width: 32px;
      height: 32px;
      background-color: var(--color-primary-light);
      color: white;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    .user-name {
      font-weight: 500;
      font-size: 14px;
    }
    .main-content {
      padding: var(--spacing-6);
      flex: 1;
      overflow-y: auto;
    }
  `]
})
export class MainLayoutComponent {}
