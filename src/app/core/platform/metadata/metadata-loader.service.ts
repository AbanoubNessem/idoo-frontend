import { Injectable, inject } from '@angular/core';
import { RegistryManagerService } from '../../registry/registry-manager.service';
import { RegistryEntry } from '../../registry/registry.types';
import { MetadataEntry, MetadataType, MetadataValidationError } from './metadata.types';

type RegistryKey = keyof Omit<RegistryManagerService,
  'isPublished' | 'publishAll' | 'getOverallStatus' | 'getDiagnostics' | 'clearAll' | 'getStatistics'
>;

const REGISTRY_TYPE_MAP: Array<{ key: RegistryKey; type: MetadataType }> = [
  { key: 'entity',       type: 'entity' },
  { key: 'form',         type: 'form' },
  { key: 'table',        type: 'table' },
  { key: 'route',        type: 'route' },
  { key: 'menu',         type: 'menu' },
  { key: 'action',       type: 'action' },
  { key: 'permission',   type: 'permission' },
  { key: 'widget',       type: 'widget' },
  { key: 'workflow',     type: 'workflow' },
  { key: 'dashboard',    type: 'dashboard' },
  { key: 'lookup',       type: 'lookup' },
  { key: 'validation',   type: 'validator' },
  { key: 'report',       type: 'report' },
  { key: 'layout',       type: 'layout' },
  { key: 'theme',        type: 'theme' },
  { key: 'localization', type: 'localization' },
];

@Injectable({ providedIn: 'root' })
export class MetadataLoaderService {
  private readonly registry = inject(RegistryManagerService);

  load(): Map<string, MetadataEntry> {
    const entries = new Map<string, MetadataEntry>();

    for (const { key, type } of REGISTRY_TYPE_MAP) {
      const registryService = this.registry[key] as { getAll(): RegistryEntry<unknown>[] };
      const registryEntries = registryService.getAll();

      for (const re of registryEntries) {
        const entry = this.toMetadataEntry(re, type);
        const compositeKey = `${type}:${re.id}`;
        entries.set(compositeKey, entry);
      }
    }

    return entries;
  }

  loadByType(type: MetadataType): Map<string, MetadataEntry> {
    const mapping = REGISTRY_TYPE_MAP.find(m => m.type === type);
    if (!mapping) return new Map();

    const registryService = this.registry[mapping.key] as { getAll(): RegistryEntry<unknown>[] };
    const result = new Map<string, MetadataEntry>();

    for (const re of registryService.getAll()) {
      const entry = this.toMetadataEntry(re, type);
      result.set(`${type}:${re.id}`, entry);
    }

    return result;
  }

  getLoadedCount(): Record<MetadataType, number> {
    return Object.fromEntries(
      REGISTRY_TYPE_MAP.map(({ key, type }) => {
        const svc = this.registry[key] as { getAll(): RegistryEntry<unknown>[] };
        return [type, svc.getAll().length];
      })
    ) as Record<MetadataType, number>;
  }

  private toMetadataEntry<T>(re: RegistryEntry<T>, type: MetadataType): MetadataEntry<T> {
    const registryErrors: MetadataValidationError[] = re.validationErrors.map(msg => ({
      entryId: re.id,
      type,
      field: 'definition',
      message: msg,
      code: 'REGISTRY_VALIDATION_ERROR',
      severity: 'error',
    }));

    return {
      id: re.id,
      type,
      sourcePluginId: re.sourcePluginId,
      version: re.version,
      definition: Object.freeze({ ...re.definition as object }) as Readonly<T>,
      resolvedAt: null,
      validationErrors: registryErrors,
      isResolved: false,
      isValid: re.validationErrors.length === 0,
      overriddenBy: re.overriddenBy,
      checksum: re.checksum,
    };
  }
}
