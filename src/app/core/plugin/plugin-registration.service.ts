import { Injectable, inject } from '@angular/core';
import { PluginManifest } from './plugin-manifest.model';
import { RegistryManagerService } from '../registry/registry-manager.service';

export interface PluginRegistrationResult {
  pluginId: string;
  registered: {
    entities: number;
    routes: number;
    menus: number;
    permissions: number;
    widgets: number;
    workflows: number;
    dashboards: number;
    reports: number;
    lookups: number;
    validators: number;
    actions: number;
    themes: number;
    locales: number;
    layouts: number;
  };
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class PluginRegistrationService {
  private readonly registryManager = inject(RegistryManagerService);

  register(manifest: PluginManifest): PluginRegistrationResult {
    const pluginId = manifest.id;
    const registered = this.buildEmptyRegistered();
    const errors: string[] = [];

    try {
      // 1. Permissions first (other entries may reference them)
      for (const perm of manifest.permissions ?? []) {
        const entry = this.registryManager.permission.register(perm.code, perm, pluginId, manifest.version);
        if (entry.validationErrors.length > 0) {
          errors.push(...entry.validationErrors);
        } else {
          registered.permissions++;
        }
      }

      // 2. Lookups (referenced by form fields)
      for (const lookup of manifest.lookups ?? []) {
        const entry = this.registryManager.lookup.register(lookup.id, lookup, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.lookups++;
        else errors.push(...entry.validationErrors);
      }

      // 3. Validators
      for (const validator of manifest.validators ?? []) {
        const entry = this.registryManager.validation.register(validator.id, validator, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.validators++;
        else errors.push(...entry.validationErrors);
      }

      // 4. Entities
      for (const entity of manifest.entities ?? []) {
        const entry = this.registryManager.entity.register(entity.id, entity, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.entities++;
        else errors.push(...entry.validationErrors);
      }

      // 5. Workflows (depend on entities)
      for (const workflow of manifest.workflows ?? []) {
        const entry = this.registryManager.workflow.register(workflow.id, workflow, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.workflows++;
        else errors.push(...entry.validationErrors);
      }

      // 6. Actions
      for (const action of manifest.actions ?? []) {
        const entry = this.registryManager.action.register(action.id, action, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.actions++;
        else errors.push(...entry.validationErrors);
      }

      // 7. Routes
      for (const route of manifest.routes ?? []) {
        const id = `${pluginId.toLowerCase()}:route:${route.path.replace(/\//g, '-')}`;
        const entry = this.registryManager.route.register(id, route, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.routes++;
        else errors.push(...entry.validationErrors);
      }

      // 8. Menus
      for (const menu of manifest.menus ?? []) {
        const entry = this.registryManager.menu.register(menu.id, menu, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.menus++;
        else errors.push(...entry.validationErrors);
      }

      // 9. Widgets
      for (const widget of manifest.widgets ?? []) {
        const entry = this.registryManager.widget.register(widget.id, widget, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.widgets++;
        else errors.push(...entry.validationErrors);
      }

      // 10. Dashboards
      for (const dashboard of manifest.dashboards ?? []) {
        const entry = this.registryManager.dashboard.register(dashboard.id, dashboard, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.dashboards++;
        else errors.push(...entry.validationErrors);
      }

      // 11. Reports
      for (const report of manifest.reports ?? []) {
        const entry = this.registryManager.report.register(report.id, report, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.reports++;
        else errors.push(...entry.validationErrors);
      }

      // 12. Themes
      for (const theme of manifest.themes ?? []) {
        const entry = this.registryManager.theme.register(theme.id, theme, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.themes++;
        else errors.push(...entry.validationErrors);
      }

      // 13. Locales
      for (const locale of manifest.locales ?? []) {
        const id = `${locale.locale}:${locale.namespace}`;
        const entry = this.registryManager.localization.register(id, locale, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.locales++;
        else errors.push(...entry.validationErrors);
      }

      // 14. Layouts
      for (const layout of manifest.layouts ?? []) {
        const entry = this.registryManager.layout.register(layout.id, layout, pluginId, manifest.version);
        if (entry.validationErrors.length === 0) registered.layouts++;
        else errors.push(...entry.validationErrors);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }

    return { pluginId, registered, errors };
  }

  private buildEmptyRegistered(): PluginRegistrationResult['registered'] {
    return {
      entities: 0, routes: 0, menus: 0, permissions: 0, widgets: 0,
      workflows: 0, dashboards: 0, reports: 0, lookups: 0, validators: 0,
      actions: 0, themes: 0, locales: 0, layouts: 0,
    };
  }
}
