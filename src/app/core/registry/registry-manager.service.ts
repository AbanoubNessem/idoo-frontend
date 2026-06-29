import { Injectable, inject, signal, computed } from '@angular/core';
import { RegistryDiagnosticsReport, RegistryStatus } from './registry.types';
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
import { BaseRegistry } from './base.registry';

export interface RegistryManagerDiagnostics {
  totalRegistries: number;
  publishedRegistries: number;
  degradedRegistries: number;
  registries: RegistryDiagnosticsReport[];
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class RegistryManagerService {
  readonly entity = inject(EntityRegistryService);
  readonly form = inject(FormRegistryService);
  readonly table = inject(TableRegistryService);
  readonly route = inject(RouteRegistryService);
  readonly menu = inject(MenuRegistryService);
  readonly action = inject(ActionRegistryService);
  readonly permission = inject(PermissionRegistryService);
  readonly widget = inject(WidgetRegistryService);
  readonly workflow = inject(WorkflowRegistryService);
  readonly dashboard = inject(DashboardRegistryService);
  readonly lookup = inject(LookupRegistryService);
  readonly validation = inject(ValidationRegistryService);
  readonly report = inject(ReportRegistryService);
  readonly layout = inject(LayoutRegistryService);
  readonly theme = inject(ThemeRegistryService);
  readonly localization = inject(LocalizationRegistryService);

  private readonly _isPublished = signal(false);
  readonly isPublished = computed(() => this._isPublished());

  private get allRegistries(): BaseRegistry<unknown>[] {
    return [
      this.entity, this.form, this.table, this.route, this.menu,
      this.action, this.permission, this.widget, this.workflow,
      this.dashboard, this.lookup, this.validation, this.report,
      this.layout, this.theme, this.localization,
    ] as BaseRegistry<unknown>[];
  }

  publishAll(): void {
    for (const registry of this.allRegistries) {
      registry.publish();
    }
    this._isPublished.set(true);
  }

  getOverallStatus(): RegistryStatus {
    const statuses = this.allRegistries.map(r => r.status());
    if (statuses.some(s => s === 'degraded')) return 'degraded';
    if (statuses.every(s => s === 'published')) return 'published';
    return 'open';
  }

  getDiagnostics(): RegistryManagerDiagnostics {
    const reports = this.allRegistries.map(r => r.getDiagnostics());
    const published = reports.filter(r => r.publishedEntries > 0).length;
    const degraded = reports.filter(r => r.invalidEntries > 0).length;

    return {
      totalRegistries: this.allRegistries.length,
      publishedRegistries: published,
      degradedRegistries: degraded,
      registries: reports,
      generatedAt: new Date().toISOString(),
    };
  }

  clearAll(): void {
    for (const registry of this.allRegistries) {
      registry.clear();
    }
    this._isPublished.set(false);
  }

  getStatistics(): Record<string, number> {
    return Object.fromEntries(
      this.allRegistries.map(r => [r.name, r.getAll().length])
    );
  }
}
