import { Injectable, inject } from '@angular/core';
import { PlatformKernelService } from './platform-kernel.service';
import { HealthService } from './services/health.service';
import { DiagnosticsService } from './services/diagnostics.service';
import { VersionService } from './services/version.service';
import { LifecycleManagerService } from './services/lifecycle-manager.service';
import { PlatformContextService } from './context/platform-context.service';
import { IHealthCheck, LifecycleHookFn, LifecycleHookType } from './kernel.types';

@Injectable({ providedIn: 'root' })
export class KernelFacadeService {
  private readonly kernel = inject(PlatformKernelService);
  private readonly healthService = inject(HealthService);
  private readonly diagnosticsService = inject(DiagnosticsService);
  private readonly versionService = inject(VersionService);
  private readonly lifecycleManager = inject(LifecycleManagerService);
  private readonly platformContext = inject(PlatformContextService);

  // ─── Kernel State ─────────────────────────────────────────────────────────
  readonly state = this.kernel.state;
  readonly isReady = this.kernel.isReady;
  readonly isDegraded = this.kernel.isDegraded;
  readonly bootError = this.kernel.bootError;

  // ─── Platform Context ─────────────────────────────────────────────────────
  readonly isAuthenticated = this.platformContext.isAuthenticated;
  readonly currentUser = this.platformContext.currentUser;
  readonly tenantId = this.platformContext.tenantId;
  readonly companyId = this.platformContext.companyId;
  readonly branchId = this.platformContext.branchId;
  readonly permissions = this.platformContext.permissions;

  // ─── Boot Control ────────────────────────────────────────────────────────
  boot(): Promise<void> {
    return this.kernel.boot();
  }

  shutdown(): Promise<void> {
    return this.kernel.shutdown();
  }

  // ─── Version ─────────────────────────────────────────────────────────────
  getVersion() {
    return this.versionService.getVersion();
  }

  isVersionCompatible(range: string): boolean {
    return this.versionService.satisfies(range);
  }

  // ─── Health ──────────────────────────────────────────────────────────────
  async getHealth() {
    return this.kernel.getHealth();
  }

  registerHealthCheck(check: IHealthCheck): void {
    this.healthService.register(check);
  }

  // ─── Diagnostics ─────────────────────────────────────────────────────────
  getDiagnostics() {
    return this.kernel.getDiagnostics();
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  onLifecycle(type: LifecycleHookType, fn: LifecycleHookFn): () => void {
    return this.lifecycleManager.on(type, fn);
  }

  // ─── Permission Checks ───────────────────────────────────────────────────
  hasPermission(code: string): boolean {
    return this.platformContext.hasPermission(code);
  }

  hasAnyPermission(...codes: string[]): boolean {
    return this.platformContext.hasAnyPermission(...codes);
  }

  isFeatureEnabled(flag: string): boolean {
    return this.platformContext.isFeatureEnabled(flag);
  }

  isModuleActive(moduleId: string): boolean {
    return this.platformContext.isModuleActive(moduleId);
  }
}
