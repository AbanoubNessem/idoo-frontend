import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PlatformContextService, UserContext } from './platform-context.service';

const mockUser: UserContext = {
  id: 'u1',
  username: 'john.doe',
  email: 'john@example.com',
  fullName: 'John Doe',
  roles: ['admin'],
};

describe('PlatformContextService', () => {
  let service: PlatformContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PlatformContextService] });
    service = TestBed.inject(PlatformContextService);
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should set authentication state', () => {
    service.setAuthenticated(mockUser, ['HR:EMPLOYEES:READ', 'HR:EMPLOYEES:CREATE']);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.permissions().length).toBe(2);
  });

  it('should check permissions correctly', () => {
    service.setAuthenticated(mockUser, ['HR:EMPLOYEES:READ']);
    expect(service.hasPermission('HR:EMPLOYEES:READ')).toBe(true);
    expect(service.hasPermission('HR:EMPLOYEES:DELETE')).toBe(false);
  });

  it('should check hasAnyPermission', () => {
    service.setAuthenticated(mockUser, ['HR:EMPLOYEES:READ']);
    expect(service.hasAnyPermission('HR:EMPLOYEES:READ', 'HR:EMPLOYEES:DELETE')).toBe(true);
    expect(service.hasAnyPermission('HR:EMPLOYEES:DELETE', 'HR:EMPLOYEES:CREATE')).toBe(false);
  });

  it('should check hasAllPermissions', () => {
    service.setAuthenticated(mockUser, ['HR:EMPLOYEES:READ', 'HR:EMPLOYEES:CREATE']);
    expect(service.hasAllPermissions('HR:EMPLOYEES:READ', 'HR:EMPLOYEES:CREATE')).toBe(true);
    expect(service.hasAllPermissions('HR:EMPLOYEES:READ', 'HR:EMPLOYEES:DELETE')).toBe(false);
  });

  it('should set context values', () => {
    service.setTenant('t1');
    service.setCompany('c1');
    service.setBranch('b1');
    expect(service.tenantId()).toBe('t1');
    expect(service.companyId()).toBe('c1');
    expect(service.branchId()).toBe('b1');
    expect(service.hasContext()).toBe(true);
  });

  it('should clear auth', () => {
    service.setAuthenticated(mockUser, ['HR:EMPLOYEES:READ']);
    service.setTenant('t1');
    service.clearAuth();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.tenantId()).toBeNull();
  });

  it('should check feature flags', () => {
    service.setFeatureFlags(['hr.advanced-payroll', 'fleet.gps']);
    expect(service.isFeatureEnabled('hr.advanced-payroll')).toBe(true);
    expect(service.isFeatureEnabled('nonexistent')).toBe(false);
  });

  it('should check active modules', () => {
    service.setActiveModules(['HR', 'FLEET']);
    expect(service.isModuleActive('HR')).toBe(true);
    expect(service.isModuleActive('CRM')).toBe(false);
  });

  it('should produce snapshot', () => {
    service.setAuthenticated(mockUser, ['PERM1']);
    service.setTenant('t1');
    const snap = service.snapshot();
    expect(snap['isAuthenticated']).toBe(true);
    expect(snap['tenantId']).toBe('t1');
    expect(snap['permissionCount']).toBe(1);
  });
});
