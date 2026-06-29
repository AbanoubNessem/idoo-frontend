import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ComponentResolverService } from '../resolver/component-resolver.service';
import { ComponentRegistryService } from '../registry/component-registry.service';
import { ComponentDefinition } from '../component.types';

@Component({ standalone: true, template: '' })
class TextStub {}

@Component({ standalone: true, template: '' })
class LazyStub {}

function registerField(registry: ComponentRegistryService, key: string, fieldType: ComponentDefinition['fieldType']): void {
  registry.register({
    key,
    version: '1.0',
    category: 'field',
    fieldType,
    component: TextStub,
    tags: [],
    description: '',
    registeredAt: new Date().toISOString(),
  });
}

describe('ComponentResolverService', () => {
  let service: ComponentResolverService;
  let registry: ComponentRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service  = TestBed.inject(ComponentResolverService);
    registry = TestBed.inject(ComponentRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start idle', () => {
    expect(service.state()).toBe('idle');
  });

  it('should resolve null for unregistered field type', async () => {
    const result = await service.resolveField('text');
    expect(result).toBeNull();
  });

  it('should resolve a registered field type', async () => {
    registerField(registry, 'pf-text', 'text');
    const type = await service.resolveField('text');
    expect(type).toBe(TextStub);
  });

  it('should resolve a registered key', async () => {
    registerField(registry, 'pf-number', 'number');
    const type = await service.resolveKey('pf-number');
    expect(type).toBe(TextStub);
  });

  it('should return null for unknown key', async () => {
    const type = await service.resolveKey('missing');
    expect(type).toBeNull();
  });

  it('should cache results after first resolution', async () => {
    registerField(registry, 'pf-date', 'date');
    await service.resolveKey('pf-date');
    expect(service.isCached('pf-date')).toBeTrue();
  });

  it('should clear cache', async () => {
    registerField(registry, 'pf-time', 'time');
    await service.resolveKey('pf-time');
    service.clearCache();
    expect(service.isCached('pf-time')).toBeFalse();
  });

  it('should resolve lazy factory components', async () => {
    registry.register({
      key: 'lazy-text',
      version: '1.0',
      category: 'field',
      fieldType: 'text',
      component: TextStub,
      factory: async () => LazyStub,
      tags: [],
      description: '',
      registeredAt: new Date().toISOString(),
    });

    const type = await service.resolveKey('lazy-text');
    expect(type).toBe(LazyStub);
  });

  it('should reach ready state after resolution', async () => {
    registerField(registry, 'pf-select', 'select');
    await service.resolveKey('pf-select');
    expect(service.state()).toBe('ready');
  });

  it('should pre-resolve all eagerly registered components', async () => {
    registerField(registry, 'pf-a', 'text');
    registerField(registry, 'pf-b', 'number');
    await service.preResolveAll();
    expect(service.isCached('pf-a')).toBeTrue();
    expect(service.isCached('pf-b')).toBeTrue();
  });
});
