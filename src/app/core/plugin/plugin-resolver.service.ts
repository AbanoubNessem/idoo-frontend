import { Injectable } from '@angular/core';
import { PluginManifest } from './plugin-manifest.model';
import { PluginError } from './plugin.types';

export interface ResolutionResult {
  sortedOrder: string[];
  errors: PluginError[];
  warnings: string[];
}

@Injectable({ providedIn: 'root' })
export class PluginResolverService {

  resolve(manifests: PluginManifest[]): ResolutionResult {
    const errors: PluginError[] = [];
    const warnings: string[] = [];
    const manifestMap = new Map(manifests.map(m => [m.id, m]));

    // Check required dependencies exist
    for (const manifest of manifests) {
      for (const dep of manifest.dependencies ?? []) {
        if (!manifestMap.has(dep.pluginId)) {
          errors.push({
            code: 'DEPENDENCY_MISSING',
            pluginId: manifest.id,
            message: `Required dependency '${dep.pluginId}' not found`,
            timestamp: new Date().toISOString(),
          });
        }
      }
      for (const dep of manifest.optionalDependencies ?? []) {
        if (!manifestMap.has(dep.pluginId)) {
          warnings.push(`${manifest.id}: optional dependency '${dep.pluginId}' not present`);
        }
      }
    }

    const sortedOrder = this.topologicalSort(manifests, manifestMap, errors);

    return { sortedOrder, errors, warnings };
  }

  private topologicalSort(
    manifests: PluginManifest[],
    manifestMap: Map<string, PluginManifest>,
    errors: PluginError[],
  ): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const m of manifests) {
      inDegree.set(m.id, 0);
      adjacency.set(m.id, []);
    }

    for (const m of manifests) {
      for (const dep of m.dependencies ?? []) {
        if (manifestMap.has(dep.pluginId)) {
          adjacency.get(dep.pluginId)!.push(m.id);
          inDegree.set(m.id, (inDegree.get(m.id) ?? 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    // Sort queue by overridePriority (higher = later)
    queue.sort((a, b) => {
      const pa = manifestMap.get(a)?.overridePriority ?? 0;
      const pb = manifestMap.get(b)?.overridePriority ?? 0;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b);
    });

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      for (const neighbor of adjacency.get(current) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (sorted.length !== manifests.length) {
      const remaining = manifests
        .filter(m => !sorted.includes(m.id))
        .map(m => m.id);

      errors.push({
        code: 'DEPENDENCY_CYCLE',
        pluginId: remaining.join(','),
        message: `Circular dependency detected among: ${remaining.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    return sorted;
  }

  checkVersionCompatibility(
    dependency: import('./plugin.types').PluginDependency,
    installedVersion: string,
  ): boolean {
    const required = dependency.version;
    if (required === '*') return true;

    const parts = installedVersion.split('.').map(Number);
    const installed = { major: parts[0] ?? 0, minor: parts[1] ?? 0, patch: parts[2] ?? 0 };

    if (required.startsWith('^')) {
      const min = this.parseVersion(required.slice(1));
      return installed.major === min.major &&
        (installed.minor > min.minor ||
          (installed.minor === min.minor && installed.patch >= min.patch));
    }

    if (required.startsWith('>=')) {
      const min = this.parseVersion(required.slice(2).trim());
      return installed.major > min.major ||
        (installed.major === min.major && installed.minor > min.minor) ||
        (installed.major === min.major && installed.minor === min.minor && installed.patch >= min.patch);
    }

    const exact = this.parseVersion(required);
    return installed.major === exact.major &&
      installed.minor === exact.minor &&
      installed.patch === exact.patch;
  }

  private parseVersion(raw: string): { major: number; minor: number; patch: number } {
    const parts = raw.trim().split('.').map(Number);
    return { major: parts[0] ?? 0, minor: parts[1] ?? 0, patch: parts[2] ?? 0 };
  }
}
