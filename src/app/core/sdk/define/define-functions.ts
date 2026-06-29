import { EntityDef } from '../../registry/registries/entity.registry';
import { FormDef } from '../../registry/registries/form.registry';
import { TableDef } from '../../registry/registries/table.registry';
import { RouteDef } from '../../registry/registries/route.registry';
import { MenuItemDef } from '../../registry/registries/menu.registry';
import { ActionDef } from '../../registry/registries/action.registry';
import { PermissionDef } from '../../registry/registries/permission.registry';
import { WidgetDef } from '../../registry/registries/widget.registry';
import { WorkflowDef } from '../../registry/registries/workflow.registry';
import { DashboardDef } from '../../registry/registries/dashboard.registry';
import { LookupDef } from '../../registry/registries/lookup.registry';
import { ValidatorDef } from '../../registry/registries/validation.registry';
import { ReportDef } from '../../registry/registries/report.registry';
import { PluginManifest } from '../../plugin/plugin-manifest.model';
import { validateEntity, validateForm, validateTable, validateWorkflow, validatePlugin } from '../validators/metadata-validators';
import { SDKValidationError } from '../validators/sdk-validation-error';

const IS_DEV = typeof window !== 'undefined'
  ? !(window as unknown as Record<string, unknown>)['IS_PRODUCTION']
  : true;

function assertValid(factoryName: string, result: import('../validators/sdk-validation-error').ValidationResult, def: unknown): void {
  if (!IS_DEV) return;
  for (const error of result.errors) {
    throw new SDKValidationError(factoryName, error.path, error.value ?? def, error.code, error.hint);
  }
}

// ─── define* functions ────────────────────────────────────────────────────────

export function definePlugin(config: PluginManifest): PluginManifest {
  assertValid('definePlugin', validatePlugin(config), config);
  return Object.freeze({ ...config });
}

export function defineEntity(config: EntityDef): EntityDef {
  assertValid('defineEntity', validateEntity(config), config);
  return Object.freeze({
    searchable: false,
    exportable: false,
    hasSoftDelete: false,
    defaultView: 'table' as const,
    ...config,
  });
}

export function defineForm(config: FormDef): FormDef {
  assertValid('defineForm', validateForm(config), config);
  return Object.freeze({
    layout: 'two-column' as const,
    ...config,
    sections: config.sections.map(section => ({
      columns: 2 as const,
      ...section,
      fields: section.fields.map(field => ({
        required: false,
        disabled: false,
        colSpan: 1,
        ...field,
      })),
    })),
  });
}

export function defineTable(config: TableDef): TableDef {
  assertValid('defineTable', validateTable(config), config);
  return Object.freeze({
    pageSize: 20,
    selectable: true,
    searchable: true,
    exportable: false,
    rowClickBehavior: 'navigate-detail',
    ...config,
  });
}

export function defineAction(config: ActionDef): ActionDef {
  return Object.freeze({
    type: 'http',
    variant: 'secondary' as const,
    order: 99,
    navigateAfter: 'none',
    ...config,
  });
}

export function definePermission(config: PermissionDef): PermissionDef {
  return Object.freeze({ ...config });
}

export function defineMenu(config: MenuItemDef): MenuItemDef {
  return Object.freeze({ order: 99, ...config });
}

export function defineRoute(config: RouteDef): RouteDef {
  return Object.freeze({ preload: false, ...config });
}

export function defineWidget(config: WidgetDef): WidgetDef {
  if (!config.component) {
    throw new SDKValidationError('defineWidget', 'component', undefined, 'function', 'Provide a lazy-loaded component: () => import(...)');
  }
  return Object.freeze({
    minWidth: 2,
    defaultWidth: 4,
    defaultHeight: 3,
    ...config,
  });
}

export function defineDashboard(config: DashboardDef): DashboardDef {
  return Object.freeze({ locked: false, ...config });
}

export function defineWorkflow(config: WorkflowDef): WorkflowDef {
  assertValid('defineWorkflow', validateWorkflow(config), config);
  return Object.freeze({ ...config });
}

export function defineLookup(config: LookupDef): LookupDef {
  return Object.freeze({ source: 'static' as const, ...config });
}

export function defineReport(config: ReportDef): ReportDef {
  return Object.freeze({ ...config });
}

export function defineValidator(config: ValidatorDef): ValidatorDef {
  if (!config.factory || typeof config.factory !== 'function') {
    throw new SDKValidationError('defineValidator', 'factory', config.factory, 'ValidatorFactory');
  }
  return Object.freeze({ ...config });
}
