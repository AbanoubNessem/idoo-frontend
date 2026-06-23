import { Component, HostListener, isDevMode, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStateService } from '../auth/state/auth.state';
import { ContextStateService } from '../context/state/context.state';
import { PermissionStateService } from '../auth/state/permission.state';
import { SessionManagerService } from '../auth/services/session-manager.service';

@Component({
  selector: 'app-debug-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-panel" *ngIf="isVisible && isDev">
      <div class="debug-header">
        <h3>Developer Debug Panel</h3>
        <button (click)="togglePanel()" class="close-btn">X</button>
      </div>
      <div class="debug-content">
        <section>
          <h4>Routing</h4>
          <p>Current Route: <strong>{{ currentRoute }}</strong></p>
        </section>

        <section>
          <h4>Auth State</h4>
          <p>Is Logged In: <strong>{{ isLoggedIn() }}</strong></p>
          <p>Is Loading: <strong>{{ isLoading() }}</strong></p>
          <p>User ID: <strong>{{ user()?.id || 'N/A' }}</strong></p>
          <p>Email: <strong>{{ user()?.email || 'N/A' }}</strong></p>
          <div class="token-info">
            <p>Access Token: <span class="truncate">{{ accessToken() || 'None' }}</span></p>
            <p>Refresh Token: <span class="truncate">{{ refreshToken() || 'None' }}</span></p>
          </div>
        </section>

        <section>
          <h4>Context State</h4>
          <p>Tenant ID: <strong>{{ tenantId() || 'N/A' }}</strong></p>
          <p>Company ID: <strong>{{ companyId() || 'N/A' }}</strong></p>
          <p>Branch ID: <strong>{{ branchId() || 'N/A' }}</strong></p>
        </section>

        <section>
          <h4>Permissions</h4>
          <p>Count: <strong>{{ permissions().length }}</strong></p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .debug-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background-color: rgba(15, 23, 42, 0.95);
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      font-family: monospace;
      font-size: 12px;
      overflow: hidden;
    }
    .debug-header {
      background-color: #1e293b;
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #334155;
    }
    .debug-header h3 {
      margin: 0;
      color: #38bdf8;
      font-size: 14px;
    }
    .close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-weight: bold;
    }
    .close-btn:hover {
      color: #f8fafc;
    }
    .debug-content {
      padding: 15px;
      overflow-y: auto;
      flex: 1;
    }
    section {
      margin-bottom: 15px;
      border-bottom: 1px dashed #334155;
      padding-bottom: 10px;
    }
    section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    h4 {
      margin: 0 0 8px 0;
      color: #a78bfa;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
    }
    p {
      margin: 4px 0;
      display: flex;
      justify-content: space-between;
    }
    strong {
      color: #e2e8f0;
    }
    .truncate {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #94a3b8;
    }
  `]
})
export class DebugPanelComponent {
  isDev = isDevMode();
  isVisible = false;

  private authState = inject(AuthStateService);
  private contextState = inject(ContextStateService);
  private permissionState = inject(PermissionStateService);
  private router = inject(Router);

  isLoggedIn = this.authState.isAuthenticated;
  isLoading = this.authState.isLoading;
  user = this.authState.user;
  accessToken = this.authState.accessToken;
  refreshToken = this.authState.refreshToken;

  tenantId = this.contextState.tenantId;
  companyId = this.contextState.companyId;
  branchId = this.contextState.branchId;

  permissions = this.permissionState.permissions;

  get currentRoute(): string {
    return this.router.url;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.shiftKey && (event.key === 'd' || event.key === 'D')) {
      event.preventDefault();
      this.togglePanel();
    }
  }

  togglePanel() {
    this.isVisible = !this.isVisible;
  }
}
