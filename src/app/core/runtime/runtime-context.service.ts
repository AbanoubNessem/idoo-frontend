import { Injectable, inject, computed } from '@angular/core';
import { PlatformContextService } from '../kernel/context/platform-context.service';
import { RegistryManagerService } from '../registry/registry-manager.service';
import { StateEngineService } from './engines/state-engine.service';

@Injectable({ providedIn: 'root' })
export class RuntimeContextService {
  private readonly platformContext = inject(PlatformContextService);
  private readonly registryManager = inject(RegistryManagerService);
  private readonly stateEngine = inject(StateEngineService);

  // ─── Auth Context ─────────────────────────────────────────────────────────
  readonly isAuthenticated = this.platformContext.isAuthenticated;
  readonly currentUser = this.platformContext.currentUser;
  readonly tenantId = this.platformContext.tenantId;
  readonly companyId = this.platformContext.companyId;
  readonly branchId = this.platformContext.branchId;
  readonly permissions = this.platformContext.permissions;

  // ─── Module Context ───────────────────────────────────────────────────────
  readonly activeModules = this.platformContext.activeModules;
  readonly featureFlags = this.platformContext.featureFlags;

  // ─── Registry Shortcuts ───────────────────────────────────────────────────
  readonly isRegistryPublished = this.registryManager.isPublished;

  readonly availableMenuItems = computed(() =>
    this.registryManager.menu.getSortedAll()
  );

  readonly availableRoutes = computed(() =>
    this.registryManager.route.getAll()
  );

  // ─── Query Helpers ────────────────────────────────────────────────────────

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

  getEntityConfig(entityId: string) {
    return this.registryManager.entity.getById(entityId);
  }

  getWorkflowForEntity(entityId: string) {
    return this.registryManager.workflow.getForEntity(entityId);
  }

  getLookupItems(lookupId: string) {
    return this.registryManager.lookup.getItems(lookupId);
  }

  // ─── State Shortcuts ──────────────────────────────────────────────────────

  createState<T>(key: string, initial: T) {
    return this.stateEngine.create(key, initial);
  }

  getState<T>(key: string) {
    return this.stateEngine.get<T>(key);
  }
}
