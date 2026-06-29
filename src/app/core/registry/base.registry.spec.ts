import { describe, it, expect, beforeEach } from 'vitest';
import { BaseRegistry } from './base.registry';
import { MergeStrategy } from './registry.types';

interface TestDef {
  id: string;
  value: string;
  tags?: string[];
}

class TestRegistry extends BaseRegistry<TestDef> {
  readonly name = 'test';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';
}

describe('BaseRegistry', () => {
  let registry: TestRegistry;

  beforeEach(() => {
    registry = new TestRegistry();
  });

  it('should start in initializing status', () => {
    expect(registry.status()).toBe('initializing');
  });

  it('should register an entry', () => {
    const entry = registry.register('test:foo', { id: 'test:foo', value: 'bar' }, 'plugin-a', '1.0.0');
    expect(entry.id).toBe('test:foo');
    expect(entry.sourcePluginId).toBe('plugin-a');
    expect(entry.version).toBe('1.0.0');
    expect(entry.status).toBe('registered');
  });

  it('should normalize IDs to lowercase', () => {
    registry.register('TEST:FOO', { id: 'TEST:FOO', value: 'x' }, 'plugin-a');
    expect(registry.has('test:foo')).toBe(true);
    expect(registry.has('TEST:FOO')).toBe(true);
  });

  it('should find by id', () => {
    registry.register('test:bar', { id: 'test:bar', value: 'baz' }, 'plugin-a');
    const entry = registry.getById('test:bar');
    expect(entry).toBeDefined();
    expect(entry!.definition.value).toBe('baz');
  });

  it('should return undefined for missing id', () => {
    expect(registry.getById('nonexistent')).toBeUndefined();
  });

  it('should list all entries', () => {
    registry.register('test:a', { id: 'test:a', value: 'a' }, 'plugin-a');
    registry.register('test:b', { id: 'test:b', value: 'b' }, 'plugin-a');
    expect(registry.getAll().length).toBe(2);
  });

  it('should query by plugin', () => {
    registry.register('test:a', { id: 'test:a', value: 'a' }, 'plugin-a');
    registry.register('test:b', { id: 'test:b', value: 'b' }, 'plugin-b');
    const results = registry.query({ pluginId: 'plugin-a' });
    expect(results.length).toBe(1);
    expect(results[0].sourcePluginId).toBe('plugin-a');
  });

  it('should remove entry by owning plugin', () => {
    registry.register('test:remove', { id: 'test:remove', value: 'x' }, 'plugin-a');
    const removed = registry.remove('test:remove', 'plugin-a');
    expect(removed).toBe(true);
    expect(registry.has('test:remove')).toBe(false);
  });

  it('should not remove entry by non-owning plugin', () => {
    registry.register('test:secure', { id: 'test:secure', value: 'x' }, 'plugin-a');
    const removed = registry.remove('test:secure', 'plugin-b');
    expect(removed).toBe(false);
    expect(registry.has('test:secure')).toBe(true);
  });

  it('should publish and transition status', () => {
    registry.register('test:pub', { id: 'test:pub', value: 'y' }, 'plugin-a');
    registry.publish();
    expect(registry.status()).toBe('published');
  });

  it('should clear all entries', () => {
    registry.register('test:c', { id: 'test:c', value: 'c' }, 'plugin-a');
    registry.clear();
    expect(registry.getAll().length).toBe(0);
    expect(registry.status()).toBe('initializing');
  });

  it('should produce diagnostics report', () => {
    registry.register('test:d', { id: 'test:d', value: 'd' }, 'plugin-a');
    const diag = registry.getDiagnostics();
    expect(diag.registryName).toBe('test');
    expect(diag.totalEntries).toBe(1);
  });

  it('should generate a checksum', () => {
    const entry = registry.register('test:chk', { id: 'test:chk', value: 'v' }, 'plugin-a');
    expect(entry.checksum).toBeDefined();
    expect(entry.checksum.length).toBeGreaterThan(0);
  });
});
