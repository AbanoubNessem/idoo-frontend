import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PluginResolverService } from './plugin-resolver.service';
import { PluginManifest } from './plugin-manifest.model';

const makeManifest = (id: string, deps: string[] = []): PluginManifest => ({
  id,
  name: id,
  version: '1.0.0',
  minimumPlatformVersion: '^1.0.0',
  category: 'erp',
  author: { name: 'test' },
  dependencies: deps.map(d => ({ pluginId: d, version: '^1.0.0' })),
});

describe('PluginResolverService', () => {
  let service: PluginResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PluginResolverService] });
    service = TestBed.inject(PluginResolverService);
  });

  it('should resolve single plugin with no dependencies', () => {
    const result = service.resolve([makeManifest('A')]);
    expect(result.sortedOrder).toEqual(['A']);
    expect(result.errors).toHaveLength(0);
  });

  it('should resolve in dependency order', () => {
    const plugins = [makeManifest('B', ['A']), makeManifest('A')];
    const result = service.resolve(plugins);
    const orderA = result.sortedOrder.indexOf('A');
    const orderB = result.sortedOrder.indexOf('B');
    expect(orderA).toBeLessThan(orderB);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect circular dependency', () => {
    const plugins = [makeManifest('A', ['B']), makeManifest('B', ['A'])];
    const result = service.resolve(plugins);
    expect(result.errors.some(e => e.code === 'DEPENDENCY_CYCLE')).toBe(true);
  });

  it('should error on missing required dependency', () => {
    const plugins = [makeManifest('A', ['MISSING'])];
    const result = service.resolve(plugins);
    expect(result.errors.some(e => e.code === 'DEPENDENCY_MISSING')).toBe(true);
  });

  it('should warn on missing optional dependency', () => {
    const plugins: PluginManifest[] = [{
      ...makeManifest('A'),
      optionalDependencies: [{ pluginId: 'OPT', version: '^1.0.0' }],
    }];
    const result = service.resolve(plugins);
    expect(result.warnings.some(w => w.includes('OPT'))).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should check version compatibility', () => {
    expect(service.checkVersionCompatibility({ pluginId: 'X', version: '^1.0.0' }, '1.5.0')).toBe(true);
    expect(service.checkVersionCompatibility({ pluginId: 'X', version: '^2.0.0' }, '1.5.0')).toBe(false);
    expect(service.checkVersionCompatibility({ pluginId: 'X', version: '*' }, '99.0.0')).toBe(true);
  });
});
