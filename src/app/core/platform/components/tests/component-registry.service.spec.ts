import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ComponentRegistryService } from '../registry/component-registry.service';
import { ComponentDefinition } from '../component.types';

@Component({ standalone: true, template: '' })
class StubComponent {}

function makeDefinition(key: string): ComponentDefinition {
  return {
    key,
    version: '1.0',
    category: 'field',
    fieldType: 'text',
    component: StubComponent,
    tags: ['test'],
    description: 'Test component',
    registeredAt: new Date().toISOString(),
  };
}

describe('ComponentRegistryService', () => {
  let service: ComponentRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start empty', () => {
    expect(service.registeredCount()).toBe(0);
  });

  it('should register a component and update count', () => {
    service.register(makeDefinition('test-a'));
    expect(service.registeredCount()).toBe(1);
  });

  it('should retrieve a registered component by key', () => {
    service.register(makeDefinition('test-b'));
    const entry = service.get('test-b');
    expect(entry).toBeTruthy();
    expect(entry!.key).toBe('test-b');
    expect(entry!.version).toBe('1.0');
  });

  it('should return undefined for an unknown key', () => {
    expect(service.get('no-such-key')).toBeUndefined();
  });

  it('should throw when registering a duplicate without override', () => {
    service.register(makeDefinition('test-c'));
    expect(() => service.register(makeDefinition('test-c'))).toThrow();
  });

  it('should allow override when override option is set', () => {
    service.register(makeDefinition('test-d'));
    const updated = { ...makeDefinition('test-d'), version: '2.0' };
    service.register(updated, { override: true });
    expect(service.get('test-d')!.version).toBe('2.0');
  });

  it('should find component by field type', () => {
    service.register(makeDefinition('test-e'));
    const entry = service.getByFieldType('text');
    expect(entry).toBeTruthy();
  });

  it('should query by category', () => {
    service.register(makeDefinition('test-f'));
    const results = service.query({ category: 'field' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should query by tags', () => {
    service.register(makeDefinition('test-g'));
    const results = service.query({ tags: ['test'] });
    expect(results.some(r => r.key === 'test-g')).toBeTrue();
  });

  it('should unregister a component', () => {
    service.register(makeDefinition('test-h'));
    expect(service.hasKey('test-h')).toBeTrue();
    service.unregister('test-h');
    expect(service.hasKey('test-h')).toBeFalse();
    expect(service.registeredCount()).toBe(0);
  });

  it('should resolve an eager component immediately', async () => {
    service.register(makeDefinition('test-i'));
    const type = await service.resolve('test-i');
    expect(type).toBe(StubComponent);
  });

  it('should resolve a lazy component via factory', async () => {
    const lazyDef: ComponentDefinition = {
      ...makeDefinition('test-lazy'),
      component: StubComponent,
      factory: async () => StubComponent,
    };
    service.register(lazyDef);
    const type = await service.resolve('test-lazy');
    expect(type).toBe(StubComponent);
  });

  it('should throw when resolving unknown key', async () => {
    await expectAsync(service.resolve('unknown')).toBeRejected();
  });

  it('should list all registered entries reactively', () => {
    service.register(makeDefinition('test-j'));
    service.register(makeDefinition('test-k'));
    const all = service.all();
    expect(all.length).toBe(2);
  });

  it('should return distinct categories', () => {
    service.register(makeDefinition('test-l'));
    const cats = service.getCategories();
    expect(cats).toContain('field');
  });
});
