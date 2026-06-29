import { PermissionDef } from '../../registry/registries/permission.registry';

const DEFAULT_ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'] as const;
type DefaultAction = (typeof DEFAULT_ACTIONS)[number];
type ResourcePermissions = { [A in DefaultAction]: string };

export function createPermissions<TResources extends string>(
  moduleCode: string,
  resources: TResources[],
): { [K in TResources]: ResourcePermissions } {
  const result = {} as Record<string, ResourcePermissions>;

  for (const resource of resources) {
    result[resource] = {} as ResourcePermissions;
    for (const action of DEFAULT_ACTIONS) {
      (result[resource] as Record<string, string>)[action] = `${moduleCode}:${resource}:${action}`;
    }
    Object.freeze(result[resource]);
  }

  return Object.freeze(result) as { [K in TResources]: ResourcePermissions };
}

export function permissionDefsFromModule(
  moduleCode: string,
  resources: string[],
  labels?: Record<string, Record<string, string>>,
): PermissionDef[] {
  const defs: PermissionDef[] = [];

  for (const resource of resources) {
    for (const action of DEFAULT_ACTIONS) {
      const code = `${moduleCode}:${resource}:${action}`;
      defs.push({
        code,
        moduleCode,
        resource,
        action,
        label: labels?.[resource]?.[action] ?? `${resource} ${action}`,
      });
    }
  }

  return defs;
}
