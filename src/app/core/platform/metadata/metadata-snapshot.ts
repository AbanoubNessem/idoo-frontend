import {
  MetadataConflict,
  MetadataEntry,
  MetadataIndex,
  MetadataSnapshot,
  MetadataStats,
  MetadataType,
  MetadataValidationError,
  ALL_METADATA_TYPES,
} from './metadata.types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function buildMetadataIndex(entries: Map<string, MetadataEntry>): MetadataIndex {
  const byId = new Map<string, MetadataEntry>(entries);
  const byType = new Map<MetadataType, MetadataEntry[]>();
  const byPlugin = new Map<string, MetadataEntry[]>();
  const entityToForms = new Map<string, string[]>();
  const entityToTables = new Map<string, string[]>();
  const entityToWorkflows = new Map<string, string[]>();
  const entityToActions = new Map<string, string[]>();
  const entityToRoutes = new Map<string, string[]>();
  const permissionsByCode = new Map<string, MetadataEntry>();
  const lookupById = new Map<string, MetadataEntry>();
  const menuByParent = new Map<string | null, string[]>();

  for (const type of ALL_METADATA_TYPES) {
    byType.set(type, []);
  }

  for (const entry of entries.values()) {
    // byType
    const typeList = byType.get(entry.type);
    if (typeList) typeList.push(entry);

    // byPlugin
    if (!byPlugin.has(entry.sourcePluginId)) byPlugin.set(entry.sourcePluginId, []);
    byPlugin.get(entry.sourcePluginId)!.push(entry);

    // type-specific indexes
    switch (entry.type) {
      case 'permission': {
        const def = entry.definition as { code?: string };
        const code = def.code ?? entry.id;
        permissionsByCode.set(code, entry);
        break;
      }
      case 'lookup': {
        lookupById.set(entry.id, entry);
        break;
      }
      case 'menu': {
        const def = entry.definition as { parentId?: string | null };
        const parentId = def.parentId ?? null;
        if (!menuByParent.has(parentId)) menuByParent.set(parentId, []);
        menuByParent.get(parentId)!.push(entry.id);
        break;
      }
      case 'form': {
        const entityId = extractEntityPrefix(entry.id);
        if (entityId) {
          if (!entityToForms.has(entityId)) entityToForms.set(entityId, []);
          entityToForms.get(entityId)!.push(entry.id);
        }
        break;
      }
      case 'table': {
        const entityId = extractEntityPrefix(entry.id);
        if (entityId) {
          if (!entityToTables.has(entityId)) entityToTables.set(entityId, []);
          entityToTables.get(entityId)!.push(entry.id);
        }
        break;
      }
      case 'workflow': {
        const def = entry.definition as { entityId?: string };
        if (def.entityId) {
          if (!entityToWorkflows.has(def.entityId)) entityToWorkflows.set(def.entityId, []);
          entityToWorkflows.get(def.entityId)!.push(entry.id);
        }
        break;
      }
      case 'action': {
        const def = entry.definition as { entityId?: string };
        if (def.entityId) {
          if (!entityToActions.has(def.entityId)) entityToActions.set(def.entityId, []);
          entityToActions.get(def.entityId)!.push(entry.id);
        }
        break;
      }
      case 'route': {
        const def = entry.definition as { entityId?: string };
        if (def.entityId) {
          if (!entityToRoutes.has(def.entityId)) entityToRoutes.set(def.entityId, []);
          entityToRoutes.get(def.entityId)!.push(entry.id);
        }
        break;
      }
    }
  }

  return {
    byId,
    byType,
    byPlugin,
    entityToForms,
    entityToTables,
    entityToWorkflows,
    entityToActions,
    entityToRoutes,
    permissionsByCode,
    lookupById,
    menuByParent,
  };
}

export function buildMetadataStats(
  entries: Map<string, MetadataEntry>,
  conflicts: MetadataConflict[],
  timings: Record<string, number>,
): MetadataStats {
  const byType = Object.fromEntries(
    ALL_METADATA_TYPES.map(t => [t, 0])
  ) as Record<MetadataType, number>;

  let validEntries = 0;
  let invalidEntries = 0;
  let resolvedEntries = 0;
  let unresolvedEntries = 0;

  for (const entry of entries.values()) {
    byType[entry.type] = (byType[entry.type] ?? 0) + 1;
    if (entry.isValid) validEntries++; else invalidEntries++;
    if (entry.isResolved) resolvedEntries++; else unresolvedEntries++;
  }

  const load = timings['load'] ?? 0;
  const validate = timings['validate'] ?? 0;
  const resolve = timings['resolve'] ?? 0;
  const index = timings['index'] ?? 0;

  return {
    totalEntries: entries.size,
    byType,
    validEntries,
    invalidEntries,
    resolvedEntries,
    unresolvedEntries,
    conflictCount: conflicts.length,
    loadDurationMs: load,
    validationDurationMs: validate,
    resolutionDurationMs: resolve,
    indexingDurationMs: index,
    totalPipelineDurationMs: load + validate + resolve + index,
    generatedAt: new Date().toISOString(),
  };
}

export function createMetadataSnapshot(
  entries: Map<string, MetadataEntry>,
  index: MetadataIndex,
  statistics: MetadataStats,
  errors: MetadataValidationError[],
  warnings: string[],
): MetadataSnapshot {
  return Object.freeze({
    id: generateId(),
    createdAt: new Date().toISOString(),
    entries: new Map(entries),
    index,
    statistics,
    validationErrors: Object.freeze([...errors]),
    warnings: Object.freeze([...warnings]),
  });
}

function extractEntityPrefix(id: string): string | null {
  // Convention: "namespace:entity:suffix" → entity prefix is "namespace:entity"
  const parts = id.split(':');
  if (parts.length >= 3) {
    return parts.slice(0, -1).join(':');
  }
  return null;
}
