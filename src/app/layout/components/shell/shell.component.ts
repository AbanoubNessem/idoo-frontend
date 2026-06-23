import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

/**
 * Application shell — wraps all authenticated feature routes.
 * Lazy-loaded feature modules render inside <router-outlet>.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatSidenavModule, TopbarComponent, SidebarComponent],
  template: `
    <app-topbar (toggleSidenav)="sidenavOpened.set(!sidenavOpened())" />
    <mat-sidenav-container class="shell-container">
      <mat-sidenav mode="side" [opened]="sidenavOpened()" class="shell-sidenav">
        <app-sidebar />
      </mat-sidenav>
      <mat-sidenav-content class="shell-content">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: calc(100vh - 64px); }
    .shell-sidenav { width: 260px; border-right: 1px solid #e5e7eb; }
    .shell-content { padding: 24px; background: #f9fafb; }
  `],
})
export class ShellComponent {
  readonly sidenavOpened = signal(true);
}
