// =====================================================
// Core API Models — Typed from backend Java DTOs
// Source of truth: docs/API_CONTRACT.md
// =====================================================

// ---- Shared response envelope ----

export interface ApiErrorDetail {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiErrorDetail;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
}

// ---- Domain enums (must match backend exactly) ----

/** @see API_CONTRACT.md — Enum Reference — UserStatus */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

/** @see API_CONTRACT.md — Enum Reference — PermissionAction */
export type PermissionAction =
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  | 'EXPORT' | 'IMPORT'
  | 'APPROVE' | 'REJECT'
  | 'ASSIGN' | 'REVOKE';

export type PermissionSource = 'ROLE' | 'DIRECT';

// ---- Auth ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

/** Client-side representation of the authenticated user stored in state/localStorage. */
export interface UserInfo {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  tenantId: string | null;
  companyId: string | null;
  mustChangePassword: boolean;
}

/** Tenant summary returned inside login / select-tenant responses. */
export interface TenantInfo {
  id: string;
  code: string;
  name: string;
}

export interface TokenResponse {
  success?: boolean;
  accessToken: string;
  refreshToken: string;
  user?: UserInfo | null;
  tenant?: TenantInfo | null;
}

/** Shape of data.data from POST /v1/auth/login */
export interface LoginResponseData {
  success?: boolean;
  requiresTenantSelection: boolean;
  selectionToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserInfo;
  tenant?: TenantInfo;
}

export interface TenantSelectionRequest {
  selectionToken: string;
  tenantId: string;
}

export interface AvailableTenant {
  id: string;
  code: string;
  name: string;
}

// ---- Tenant ----

export interface TenantResponse {
  id: string;
  code: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  isActive: boolean;
  maxUsers?: number;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  settings?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  code: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  isActive: boolean;
  maxUsers?: number;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  settings?: string | null;
}

export interface UpdateTenantRequest {
  code?: string;
  name?: string;
  domain?: string;
  logoUrl?: string;
  isActive?: boolean;
  maxUsers?: number;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  settings?: string | null;
}

// ---- Company ----

export interface CompanyResponse {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  taxNumber?: string;
  registrationNumber?: string;
  countryCode?: string;
  currencyCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  isActive: boolean;
  settings?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  code: string;
  name: string;
  legalName?: string;
  taxNumber?: string;
  registrationNumber?: string;
  countryCode?: string;
  currencyCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  isActive: boolean;
  settings?: string | null;
}

export interface UpdateCompanyRequest {
  code?: string;
  name?: string;
  legalName?: string;
  taxNumber?: string;
  registrationNumber?: string;
  countryCode?: string;
  currencyCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  isActive?: boolean;
  settings?: string | null;
}

// ---- Branch ----

export interface BranchResponse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  isMain: boolean;
  settings?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchSummaryResponse {
  branchId: string;
  code: string;
  name: string;
  isPrimary: boolean;
}

export interface CreateBranchRequest {
  companyId: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  isMain: boolean;
  settings?: string | null;
}

export interface UpdateBranchRequest {
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  isMain?: boolean;
  settings?: string | null;
}

// ---- Department ----

export interface DepartmentResponse {
  id: string;
  companyId: string;
  branchId?: string | null;
  parentId?: string | null;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentTreeResponse extends DepartmentResponse {
  children: DepartmentTreeResponse[];
}

export interface CreateDepartmentRequest {
  companyId: string;
  branchId?: string;
  parentId?: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateDepartmentRequest {
  parentId?: string | null;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ---- Module ----

export interface ModuleResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Permission ----

export interface PermissionResponse {
  id: number;
  moduleId: number;
  resource: string;
  action: PermissionAction;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EffectivePermissionResponse {
  moduleCode: string;
  resource: string;
  action: string;
  permissionCode: string;
  source: PermissionSource;
  isDenied: boolean;
}

export interface UserPermissionResponse {
  id: number;
  permissionId: number;
  permissionCode: string;
  permissionName: string;
  resource: string;
  action: PermissionAction;
  isDeny: boolean;
  reason?: string;
  grantedAt: string;
  expiresAt?: string | null;
}

export interface AssignPermissionsRequest {
  permissionIds: number[];
}

export interface GrantPermissionRequest {
  permissionId: number;
  reason?: string;
  expiresAt?: string;
}

export interface DenyPermissionRequest {
  permissionId: number;
  reason?: string;
}

export interface RevokePermissionRequest {
  permissionId: number;
}

// ---- Role ----

export interface RoleResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleSummaryResponse {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

export interface UserRoleResponse {
  id: number;
  roleId: string;
  roleCode: string;
  roleName: string;
  companyId?: string | null;
  branchId?: string | null;
  assignedAt: string;
  expiresAt?: string | null;
}

export interface RoleRequest {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface AssignRoleRequest {
  roleId: string;
  companyId?: string;
  branchId?: string;
  expiresAt?: string;
}

export interface RevokeRoleRequest {
  roleId: string;
}

// ---- User ----

export interface UserResponse {
  id: string;
  companyId: string;
  username: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  status: UserStatus;
  twoFactorEnabled: boolean;
  languageCode?: string;
  timezone?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles: RoleSummaryResponse[];
}

export interface UserRequest {
  companyId: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  languageCode?: string;
  timezone?: string;
}

export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  languageCode?: string;
  timezone?: string;
}

export interface AssignBranchRequest {
  branchId: string;
  isPrimary?: boolean;
}

export interface RevokeBranchRequest {
  branchId: string;
}
