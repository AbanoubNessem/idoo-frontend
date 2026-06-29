import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MetadataEngineService } from '../metadata-engine.service';
import { MetadataLifecycleService } from '../metadata-lifecycle.service';
import { MetadataCacheService } from '../metadata-cache.service';
import { MetadataLoaderService } from '../metadata-loader.service';
import { MetadataEntry, MetadataType } from '../metadata.types';
import { RegistryManagerService } from '../../../registry/registry-manager.service';
import { EntityRegistryService } from '../../../registry/registries/entity.registry';
import { FormRegistryService } from '../../../registry/registries/form.registry';
import { TableRegistryService } from '../../../registry/registries/table.registry';
import { RouteRegistryService } from '../../../registry/registries/route.registry';
import { MenuRegistryService } from '../../../registry/registries/menu.registry';
import { ActionRegistryService } from '../../../registry/registries/action.registry';
import { PermissionRegistryService } from '../../../registry/registries/permission.registry';
import { WidgetRegistryService } from '../../../registry/registries/widget.registry';
import { WorkflowRegistryService } from '../../../registry/registries/workflow.registry';
import { DashboardRegistryService } from '../../../registry/registries/dashboard.registry';
import { LookupRegistryService } from '../../../registry/registries/lookup.registry';
import { ValidationRegistryService } from '../../../registry/registries/validation.registry';
import { ReportRegistryService } from '../../../registry/registries/report.registry';
import { LayoutRegistryService } from '../../../registry/registries/layout.registry';
import { ThemeRegistryService } from '../../../registry/registries/theme.registry';
import { LocalizationRegistryService } from '../../../registry/registries/localization.registry';

describe('MetadataEngineService', () => {
  let engine: MetadataEngineService;
  let lifecycle: MetadataLifecycleService;
  let cache: MetadataCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
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
        RegistryManagerService,
      ],
    });

    engine = TestBed.inject(MetadataEngineService);
    lifecycle = TestBed.inject(MetadataLifecycleService);
    cache = TestBed.inject(MetadataCacheService);
  });

  it('should start in uninitialized state', () => {
    expect(engine.state()).toBe('uninitialized');
    expect(engine.isReady()).toBe(false);
    expect(engine.snapshot()).toBeNull();
  });

  it('should initialize and reach ready state', async () => {
    await engine.initialize();
    expect(engine.state()).toBe('ready');
    expect(engine.isReady()).toBe(true);
  });

  it('should produce a snapshot after initialize', async () => {
    await engine.initialize();
    expect(engine.snapshot()).not.toBeNull();
    expect(engine.snapshot()?.id).toBeTruthy();
  });

  it('should store snapshot in cache after initialize', async () => {
    await engine.initialize();
    expect(cache.get()).not.toBeNull();
  });

  it('should be idempotent when called twice in ready state', async () => {
    await engine.initialize();
    const snapshotId = engine.snapshot()?.id;
    await engine.initialize(); // second call should be a no-op
    expect(engine.snapshot()?.id).toBe(snapshotId);
    expect(engine.state()).toBe('ready');
  });

  it('should produce a diagnostics report', async () => {
    await engine.initialize();
    const report = engine.getDiagnostics();
    expect(report.engineState).toBe('ready');
    expect(report.snapshotId).toBeTruthy();
  });

  it('should support refresh cycle', async () => {
    await engine.initialize();
    const firstId = engine.snapshot()?.id;

    await engine.refresh();
    const secondId = engine.snapshot()?.id;

    expect(secondId).toBeTruthy();
    expect(secondId).not.toBe(firstId);
    expect(engine.state()).toBe('ready');
  });

  it('should not refresh when not in ready state', async () => {
    // not initialized
    await engine.refresh();
    expect(engine.state()).toBe('uninitialized');
  });

  it('should emit metadata:ready event after initialize', async () => {
    const received: string[] = [];
    const eventsService = TestBed.inject(
      (await import('../metadata-events.service')).MetadataEventsService
    );
    const sub = eventsService.on('metadata:ready').subscribe(e => received.push(e.type));

    await engine.initialize();
    sub.unsubscribe();

    expect(received).toContain('metadata:ready');
  });

  it('should include pipeline timing in snapshot statistics', async () => {
    await engine.initialize();
    const stats = engine.snapshot()?.statistics;
    expect(stats).toBeTruthy();
    expect(stats!.totalPipelineDurationMs).toBeGreaterThanOrEqual(0);
    expect(stats!.generatedAt).toBeTruthy();
  });
});
