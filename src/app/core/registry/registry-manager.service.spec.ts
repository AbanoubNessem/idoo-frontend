import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RegistryManagerService } from './registry-manager.service';
import { EntityRegistryService } from './registries/entity.registry';
import { FormRegistryService } from './registries/form.registry';
import { TableRegistryService } from './registries/table.registry';
import { RouteRegistryService } from './registries/route.registry';
import { MenuRegistryService } from './registries/menu.registry';
import { ActionRegistryService } from './registries/action.registry';
import { PermissionRegistryService } from './registries/permission.registry';
import { WidgetRegistryService } from './registries/widget.registry';
import { WorkflowRegistryService } from './registries/workflow.registry';
import { DashboardRegistryService } from './registries/dashboard.registry';
import { LookupRegistryService } from './registries/lookup.registry';
import { ValidationRegistryService } from './registries/validation.registry';
import { ReportRegistryService } from './registries/report.registry';
import { LayoutRegistryService } from './registries/layout.registry';
import { ThemeRegistryService } from './registries/theme.registry';
import { LocalizationRegistryService } from './registries/localization.registry';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('RegistryManagerService', () => {
  let service: RegistryManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RegistryManagerService,
        EntityRegistryService,
        FormRegistryService,
        TableRegistryService,
        RouteRegistryService,
        MenuRegistryService,
        ActionRegistryService,
        PermissionRegistryService,
        WidgetRegistryService,
        WorkflowRegistryService,
        DashboardRegistryService,
        LookupRegistryService,
        ValidationRegistryService,
        ReportRegistryService,
        LayoutRegistryService,
        ThemeRegistryService,
        LocalizationRegistryService,
      ],
    });
    service = TestBed.inject(RegistryManagerService);
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('should not be published initially', () => {
    expect(service.isPublished()).toBe(false);
  });

  it('should publish all registries', () => {
    service.publishAll();
    expect(service.isPublished()).toBe(true);
  });

  it('should return overall status', () => {
    const status = service.getOverallStatus();
    expect(status).toBeDefined();
  });

  it('should return diagnostics for all registries', () => {
    const diag = service.getDiagnostics();
    expect(Array.isArray(diag)).toBe(true);
    expect(diag.length).toBe(16);
  });

  it('should return statistics', () => {
    const stats = service.getStatistics();
    expect(stats.totalRegistries).toBe(16);
    expect(typeof stats.totalEntries).toBe('number');
  });

  it('should clear all registries', () => {
    const entityRegistry = TestBed.inject(EntityRegistryService);
    entityRegistry.register(
      'hr:employee',
      {
        apiPath: '/v1/hr/employees',
        labelSingular: 'Employee',
        labelPlural: 'Employees',
        labelField: 'fullName',
        icon: 'person',
        permissions: { list: 'HR:EMPLOYEES:READ' },
      },
      'HR_MODULE',
      '1.0.0',
    );
    service.clearAll();
    expect(entityRegistry.getAll().length).toBe(0);
  });
});
