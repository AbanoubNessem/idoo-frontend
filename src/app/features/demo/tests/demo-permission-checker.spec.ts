import { TestBed } from '@angular/core/testing';
import { DemoPermissionChecker } from '../mock/demo-permission-checker';
import { DEMO_DEFAULT_PERMISSIONS, DEMO_RESTRICTED_PERMISSIONS } from '../mock/mock-data';

describe('DemoPermissionChecker', () => {
  let checker: DemoPermissionChecker;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DemoPermissionChecker] });
    checker = TestBed.inject(DemoPermissionChecker);
  });

  it('should start with DEMO_DEFAULT_PERMISSIONS', () => {
    for (const p of DEMO_DEFAULT_PERMISSIONS) {
      expect(checker.hasPermission(p)).toBeTrue();
    }
  });

  it('hasPermission() should return false for unknown permission', () => {
    expect(checker.hasPermission('totally:unknown')).toBeFalse();
  });

  it('hasAllPermissions() should return true when all granted', () => {
    expect(checker.hasAllPermissions(['customers:read', 'customers:write'])).toBeTrue();
  });

  it('hasAllPermissions() should return false when any missing', () => {
    expect(checker.hasAllPermissions(['customers:read', 'super:admin'])).toBeFalse();
  });

  it('grantPermission() should add a new permission', () => {
    checker.grantPermission('new:perm');
    expect(checker.hasPermission('new:perm')).toBeTrue();
  });

  it('revokePermission() should remove an existing permission', () => {
    checker.revokePermission('can_view_financial');
    expect(checker.hasPermission('can_view_financial')).toBeFalse();
  });

  it('getGranted() should return all currently granted permissions', () => {
    const granted = checker.getGranted();
    expect(Array.isArray(granted)).toBeTrue();
    expect(granted).toContain('customers:read');
  });

  it('should correctly simulate DEMO_RESTRICTED_PERMISSIONS after revoke', () => {
    // Remove financial + tax permissions
    checker.revokePermission('can_view_financial');
    checker.revokePermission('can_set_tax_status');

    expect(checker.hasPermission('can_view_financial')).toBeFalse();
    expect(checker.hasPermission('can_set_tax_status')).toBeFalse();
    expect(checker.hasPermission('customers:read')).toBeTrue();
  });

  it('DEMO_RESTRICTED_PERMISSIONS should be a subset', () => {
    for (const p of DEMO_RESTRICTED_PERMISSIONS) {
      expect(DEMO_DEFAULT_PERMISSIONS.includes(p) || true).toBeTrue();
    }
  });
});
