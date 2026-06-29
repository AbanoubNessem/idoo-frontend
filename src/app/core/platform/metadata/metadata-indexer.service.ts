import { Injectable } from '@angular/core';
import { MetadataEntry, MetadataIndex, MetadataType } from './metadata.types';
import { buildMetadataIndex } from './metadata-snapshot';

@Injectable({ providedIn: 'root' })
export class MetadataIndexerService {
  build(entries: Map<string, MetadataEntry>): MetadataIndex {
    return buildMetadataIndex(entries);
  }

  getEntitiesForPlugin(index: MetadataIndex, pluginId: string): ReadonlyArray<MetadataEntry> {
    return index.byPlugin.get(pluginId) ?? [];
  }

  getByType(index: MetadataIndex, type: MetadataType): ReadonlyArray<MetadataEntry> {
    return index.byType.get(type) ?? [];
  }

  getById(index: MetadataIndex, id: string): MetadataEntry | undefined {
    return index.byId.get(id);
  }

  getFormsForEntity(index: MetadataIndex, entityId: string): ReadonlyArray<string> {
    return index.entityToForms.get(entityId) ?? [];
  }

  getTablesForEntity(index: MetadataIndex, entityId: string): ReadonlyArray<string> {
    return index.entityToTables.get(entityId) ?? [];
  }

  getWorkflowsForEntity(index: MetadataIndex, entityId: string): ReadonlyArray<string> {
    return index.entityToWorkflows.get(entityId) ?? [];
  }

  getActionsForEntity(index: MetadataIndex, entityId: string): ReadonlyArray<string> {
    return index.entityToActions.get(entityId) ?? [];
  }

  getRoutesForEntity(index: MetadataIndex, entityId: string): ReadonlyArray<string> {
    return index.entityToRoutes.get(entityId) ?? [];
  }

  getRootMenuItems(index: MetadataIndex): ReadonlyArray<string> {
    return index.menuByParent.get(null) ?? [];
  }

  getChildMenuItems(index: MetadataIndex, parentId: string): ReadonlyArray<string> {
    return index.menuByParent.get(parentId) ?? [];
  }

  getPermissionByCode(index: MetadataIndex, code: string): MetadataEntry | undefined {
    return index.permissionsByCode.get(code);
  }

  getLookupById(index: MetadataIndex, id: string): MetadataEntry | undefined {
    return index.lookupById.get(id);
  }

  summarize(index: MetadataIndex): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [type, entries] of index.byType.entries()) {
      result[type] = entries.length;
    }
    return result;
  }
}
