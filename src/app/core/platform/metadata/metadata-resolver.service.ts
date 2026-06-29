import { Injectable } from '@angular/core';
import {
  MetadataEntry,
  MetadataResolutionResult,
  MetadataValidationError,
} from './metadata.types';

@Injectable({ providedIn: 'root' })
export class MetadataResolverService {
  resolve(entries: Map<string, MetadataEntry>): {
    entries: Map<string, MetadataEntry>;
    result: MetadataResolutionResult;
  } {
    const updated = new Map<string, MetadataEntry>(entries);
    const unresolved: string[] = [];
    const warnings: string[] = [];
    let resolved = 0;

    const entityIds = this.collectIds(entries, 'entity');
    const permissionCodes = this.collectPermissionCodes(entries);
    const lookupIds = this.collectIds(entries, 'lookup');
    const menuIds = this.collectIds(entries, 'menu');
    const widgetIds = this.collectIds(entries, 'widget');

    for (const [key, entry] of entries.entries()) {
      const resolutionErrors: MetadataValidationError[] = [];
      let canResolve = true;

      switch (entry.type) {
        case 'form':
          this.resolveFormRefs(entry, lookupIds, entityIds, resolutionErrors, warnings);
          break;

        case 'route': {
          const def = entry.definition as Record<string, unknown>;
          if (def['entityId'] && !entityIds.has(def['entityId'] as string)) {
            resolutionErrors.push(this.warn(entry, 'entityId', `Route references unknown entity: ${def['entityId']}`, 'ROUTE_UNRESOLVED_ENTITY'));
            canResolve = false;
          }
          if (def['permission'] && !permissionCodes.has(def['permission'] as string)) {
            warnings.push(`Route "${entry.id}": permission "${def['permission']}" not found`);
          }
          break;
        }

        case 'action': {
          const def = entry.definition as Record<string, unknown>;
          if (def['entityId'] && !entityIds.has(def['entityId'] as string)) {
            resolutionErrors.push(this.warn(entry, 'entityId', `Action references unknown entity: ${def['entityId']}`, 'ACTION_UNRESOLVED_ENTITY'));
            canResolve = false;
          }
          if (def['permission'] && !permissionCodes.has(def['permission'] as string)) {
            warnings.push(`Action "${entry.id}": permission "${def['permission']}" not found`);
          }
          break;
        }

        case 'workflow': {
          const def = entry.definition as Record<string, unknown>;
          if (def['entityId'] && !entityIds.has(def['entityId'] as string)) {
            resolutionErrors.push(this.warn(entry, 'entityId', `Workflow references unknown entity: ${def['entityId']}`, 'WORKFLOW_UNRESOLVED_ENTITY'));
            canResolve = false;
          }
          break;
        }

        case 'menu': {
          const def = entry.definition as Record<string, unknown>;
          if (def['parentId'] && !menuIds.has(def['parentId'] as string)) {
            warnings.push(`Menu "${entry.id}": parentId "${def['parentId']}" not found`);
          }
          break;
        }

        case 'dashboard': {
          const def = entry.definition as Record<string, unknown>;
          const slots = def['slots'] as Array<Record<string, unknown>> | undefined ?? [];
          for (const slot of slots) {
            const widgetId = slot['widgetId'] as string | undefined;
            if (widgetId && !widgetIds.has(widgetId)) {
              warnings.push(`Dashboard "${entry.id}": widget "${widgetId}" not found`);
            }
          }
          break;
        }
      }

      const allErrors = [...entry.validationErrors, ...resolutionErrors];
      const isResolved = canResolve && resolutionErrors.filter(e => e.severity === 'error').length === 0;

      if (isResolved) resolved++;
      else unresolved.push(key);

      updated.set(key, {
        ...entry,
        validationErrors: allErrors,
        isValid: allErrors.filter(e => e.severity === 'error').length === 0,
        isResolved,
        resolvedAt: isResolved ? new Date().toISOString() : null,
      });
    }

    return {
      entries: updated,
      result: { resolved, unresolved, warnings },
    };
  }

  private resolveFormRefs(
    entry: MetadataEntry,
    lookupIds: Set<string>,
    entityIds: Set<string>,
    errors: MetadataValidationError[],
    warnings: string[],
  ): void {
    const def = entry.definition as Record<string, unknown>;
    const sections = def['sections'] as Array<Record<string, unknown>> | undefined ?? [];

    for (const section of sections) {
      const fields = section['fields'] as Array<Record<string, unknown>> | undefined ?? [];
      for (const field of fields) {
        const fieldType = field['type'] as string | undefined;

        if (fieldType === 'lookup' || fieldType === 'select' || fieldType === 'multi-select') {
          const lookupId = field['lookupId'] as string | undefined;
          if (lookupId && !lookupIds.has(`lookup:${lookupId}`) && !lookupIds.has(lookupId)) {
            warnings.push(`Form "${entry.id}": field "${field['key']}" references unknown lookup: ${lookupId}`);
          }
        }

        if (fieldType === 'entity-picker') {
          const entityRef = field['entityRef'] as string | undefined;
          if (entityRef && !entityIds.has(`entity:${entityRef}`) && !entityIds.has(entityRef)) {
            errors.push(this.warn(entry, `field.${field['key']}.entityRef`, `Field references unknown entity: ${entityRef}`, 'FORM_UNRESOLVED_ENTITY_REF'));
          }
        }
      }
    }
  }

  private collectIds(entries: Map<string, MetadataEntry>, type: string): Set<string> {
    const ids = new Set<string>();
    for (const [key, entry] of entries.entries()) {
      if (entry.type === type) {
        ids.add(key);
        ids.add(entry.id);
      }
    }
    return ids;
  }

  private collectPermissionCodes(entries: Map<string, MetadataEntry>): Set<string> {
    const codes = new Set<string>();
    for (const entry of entries.values()) {
      if (entry.type === 'permission') {
        const def = entry.definition as Record<string, unknown>;
        codes.add(entry.id);
        if (def['code']) codes.add(def['code'] as string);
      }
    }
    return codes;
  }

  private warn(
    entry: MetadataEntry,
    field: string,
    message: string,
    code: string,
  ): MetadataValidationError {
    return { entryId: entry.id, type: entry.type, field, message, code, severity: 'warning' };
  }
}
