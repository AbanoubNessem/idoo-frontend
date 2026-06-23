import { Component, Output, EventEmitter, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStateService } from '../../../core/auth/state/auth.state';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
  template: `
    <mat-toolbar class="topbar" color="primary">
      <button mat-icon-button (click)="toggleSidenav.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="brand">iDoo ERP</span>
      <span class="spacer"></span>
      <button mat-icon-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <div class="user-info-menu">
          <strong>{{ authState.user()?.fullName }}</strong>
          <small>{{ authState.user()?.email }}</small>
        </div>
        <button mat-menu-item (click)="authService.logout()">
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .topbar { display: flex; align-items: center; }
    .brand { font-weight: 600; margin-left: 8px; }
    .spacer { flex: 1; }
    .user-info-menu { padding: 8px 16px; display: flex; flex-direction: column; }
  `],
})
export class TopbarComponent {
  readonly authState = inject(AuthStateService);
  readonly authService = inject(AuthService);
  @Output() toggleSidenav = new EventEmitter<void>();
}
