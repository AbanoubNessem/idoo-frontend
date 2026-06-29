import { InjectionToken } from '@angular/core';
import { PluginCategory, PluginDependency } from './plugin.types';

export type PluginInitFn = (context: import('./plugin-context').PluginContext) => void | Promise<void>;

export interface AuthorInfo {
  name: string;
  email?: string;
  url?: string;
}

export interface PluginManifest {
  // ─── Identity ────────────────────────────────────────────────────────────
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  category: PluginCategory;
  author: AuthorInfo;

  // ─── Platform Compatibility ──────────────────────────────────────────────
  minimumPlatformVersion: string;
  compatiblePlatformVersions?: string;
  sdkVersion?: string;

  // ─── Dependencies ────────────────────────────────────────────────────────
  dependencies?: PluginDependency[];
  optionalDependencies?: PluginDependency[];
  peerDependencies?: PluginDependency[];

  // ─── Registry Contributions ──────────────────────────────────────────────
  entities?: import('../registry/registries/entity.registry').EntityDef[];
  routes?: import('../registry/registries/route.registry').RouteDef[];
  menus?: import('../registry/registries/menu.registry').MenuItemDef[];
  actions?: import('../registry/registries/action.registry').ActionDef[];
  permissions?: import('../registry/registries/permission.registry').PermissionDef[];
  widgets?: import('../registry/registries/widget.registry').WidgetDef[];
  workflows?: import('../registry/registries/workflow.registry').WorkflowDef[];
  dashboards?: import('../registry/registries/dashboard.registry').DashboardDef[];
  reports?: import('../registry/registries/report.registry').ReportDef[];
  lookups?: import('../registry/registries/lookup.registry').LookupDef[];
  validators?: import('../registry/registries/validation.registry').ValidatorDef[];
  themes?: import('../registry/registries/theme.registry').ThemeDef[];
  locales?: import('../registry/registries/localization.registry').LocalizationDef[];
  layouts?: import('../registry/registries/layout.registry').LayoutDef[];

  // ─── Capabilities ────────────────────────────────────────────────────────
  capabilities?: string[];
  requiredCapabilities?: string[];

  // ─── Feature Flags ───────────────────────────────────────────────────────
  featureFlags?: string[];

  // ─── Override System ─────────────────────────────────────────────────────
  overrides?: Array<{ registry: string; entryId: string; reason?: string }>;
  overridePriority?: number;

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  initFn?: PluginInitFn;
  enabledByDefault?: boolean;
}

export const PLUGIN_MANIFEST_TOKEN = new InjectionToken<PluginManifest[]>('PLUGIN_MANIFEST_TOKEN');
