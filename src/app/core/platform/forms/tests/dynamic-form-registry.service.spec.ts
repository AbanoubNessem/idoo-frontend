import { TestBed } from '@angular/core/testing';
import { DynamicFormRegistryService } from '../registry/dynamic-form-registry.service';
import { FormDefinition } from '../form.types';

const baseDef: FormDefinition = {
  id: 'test-form',
  version: '1.0',
  mode: 'create',
  layout: 'simple',
};

describe('DynamicFormRegistryService', () => {
  let service: DynamicFormRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFormRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register a form definition', () => {
    service.register(baseDef);
    expect(service.has(baseDef.id)).toBeTrue();
  });

  it('should increment registeredCount on register', () => {
    service.register(baseDef);
    expect(service.registeredCount()).toBe(1);
  });

  it('should throw on duplicate registration without overwrite', () => {
    service.register(baseDef);
    expect(() => service.register(baseDef)).toThrowError(/already registered/);
  });

  it('should allow overwrite when flag is set', () => {
    service.register(baseDef);
    const updated: FormDefinition = { ...baseDef, title: 'Updated' };
    expect(() => service.register(updated, { overwrite: true })).not.toThrow();
    expect(service.get(baseDef.id)?.definition.title).toBe('Updated');
  });

  it('should resolve eagerly registered form', async () => {
    service.register(baseDef);
    const resolved = await service.resolve(baseDef.id);
    expect(resolved).toEqual(baseDef);
  });

  it('should return null for unknown form id', async () => {
    const resolved = await service.resolve('unknown');
    expect(resolved).toBeNull();
  });

  it('should register lazy form', async () => {
    service.registerLazy('lazy-form', async () => ({ ...baseDef, id: 'lazy-form' }), { tags: ['lazy'] });
    expect(service.has('lazy-form')).toBeTrue();
    const resolved = await service.resolve('lazy-form');
    expect(resolved?.id).toBe('lazy-form');
  });

  it('should unregister and decrement count', () => {
    service.register(baseDef);
    const removed = service.unregister(baseDef.id);
    expect(removed).toBeTrue();
    expect(service.has(baseDef.id)).toBeFalse();
    expect(service.registeredCount()).toBe(0);
  });

  it('should return false when unregistering unknown id', () => {
    expect(service.unregister('unknown')).toBeFalse();
  });

  it('should query by tags', () => {
    service.register(baseDef, { tags: ['crm', 'contact'] });
    service.register({ ...baseDef, id: 'other' }, { tags: ['hr'] });
    const results = service.query(['crm']);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(baseDef.id);
  });

  it('should include all entries in all() computed', () => {
    service.register(baseDef);
    service.register({ ...baseDef, id: 'form2' });
    expect(service.all().length).toBe(2);
  });
});
