import { Injectable, signal, computed } from '@angular/core';

export interface UserContext {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class PlatformContextService {
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _currentUser = signal<UserContext | null>(null);
  private readonly _tenantId = signal<string | null>(null);
  private readonly _companyId = signal<string | null>(null);
  private readonly _branchId = signal<string | null>(null);
  private readonly _permissions = signal<string[]>([]);
  private _permissionSet = new Set<string>();
  private readonly _activeModules = signal<string[]>([]);
  private readonly _featureFlags = signal<string[]>([]);

  // ─── Read signals ─────────────────────────────────────────────────────────

  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly currentUser = computed(() => this._currentUser());
  readonly tenantId = computed(() => this._tenantId());
  readonly companyId = computed(() => this._companyId());
  readonly branchId = computed(() => this._branchId());
  readonly permissions = computed(() => this._permissions());
  readonly activeModules = computed(() => this._activeModules());
  readonly featureFlags = computed(() => this._featureFlags());

  readonly hasContext = computed(
    () => this._tenantId() !== null && this._companyId() !== null
  );

  // ─── Write API ────────────────────────────────────────────────────────────

  setAuthenticated(user: UserContext, permissions: string[]): void {
    this._currentUser.set(user);
    this._permissions.set(permissions);
    this._permissionSet = new Set(permissions);
    this._isAuthenticated.set(true);
  }

  clearAuth(): void {
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this._permissions.set([]);
    this._permissionSet = new Set();
    this._tenantId.set(null);
    this._companyId.set(null);
    this._branchId.set(null);
    this._activeModules.set([]);
  }

  setTenant(tenantId: string): void {
    this._tenantId.set(tenantId);
  }

  setCompany(companyId: string): void {
    this._companyId.set(companyId);
  }

  setBranch(branchId: string): void {
    this._branchId.set(branchId);
  }

  setActiveModules(moduleIds: string[]): void {
    this._activeModules.set(moduleIds);
  }

  setFeatureFlags(flags: string[]): void {
    this._featureFlags.set(flags);
  }

  // ─── Query API ────────────────────────────────────────────────────────────

  hasPermission(code: string): boolean {
    return this._permissionSet.has(code);
  }

  hasAnyPermission(...codes: string[]): boolean {
    return codes.some(c => this._permissionSet.has(c));
  }

  hasAllPermissions(...codes: string[]): boolean {
    return codes.every(c => this._permissionSet.has(c));
  }

  isModuleActive(moduleId: string): boolean {
    return this._activeModules().includes(moduleId);
  }

  isFeatureEnabled(flag: string): boolean {
    return this._featureFlags().includes(flag);
  }

  snapshot(): Record<string, unknown> {
    return {
      isAuthenticated: this._isAuthenticated(),
      userId: this._currentUser()?.id ?? null,
      tenantId: this._tenantId(),
      companyId: this._companyId(),
      branchId: this._branchId(),
      permissionCount: this._permissions().length,
      activeModules: this._activeModules(),
      featureFlags: this._featureFlags(),
    };
  }
}
