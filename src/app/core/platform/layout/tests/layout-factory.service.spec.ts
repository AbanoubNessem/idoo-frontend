import { TestBed } from '@angular/core/testing';
import { LayoutFactoryService } from '../layout-factory.service';
import { LayoutContextData, LayoutDefinition } from '../layout.types';

const ctx: LayoutContextData = {
  breakpoint: 'md', device: 'desktop', orientation: 'landscape',
  direction: 'ltr', permissions: [], model: {},
};

const def: LayoutDefinition = { id: 'fac-1', type: 'grid' };

describe('LayoutFactoryService', () => {
  let service: LayoutFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutFactoryService);
  });

  afterEach(() => {
    // Cleanup any instances created during test
    for (const inst of service.allInstances()) {
      service.destroy(inst.id);
    }
  });

  it('creates an instance in ready phase', () => {
    const inst = service.create(def, ctx);
    expect(inst.phase).toBe('ready');
  });

  it('created instance has resolved layout', () => {
    const inst = service.create(def, ctx);
    expect(inst.resolved).not.toBeNull();
  });

  it('get() retrieves existing instance', () => {
    service.create(def, ctx);
    const retrieved = service.get('fac-1');
    expect(retrieved?.id).toBe('fac-1');
  });

  it('has() returns true for existing instance', () => {
    service.create(def, ctx);
    expect(service.has('fac-1')).toBeTrue();
  });

  it('destroy() removes the instance', () => {
    service.create(def, ctx);
    service.destroy('fac-1');
    expect(service.has('fac-1')).toBeFalse();
  });

  it('update() refreshes the resolved layout', () => {
    service.create(def, ctx);
    const updated = service.update('fac-1', { ...ctx, breakpoint: 'xl' });
    expect(updated?.resolved?.breakpoint).toBe('xl');
  });

  it('update() returns null for unknown id', () => {
    expect(service.update('non-existent', ctx)).toBeNull();
  });

  it('allInstances() returns all active instances', () => {
    service.create({ id: 'i1', type: 'flex' }, ctx);
    service.create({ id: 'i2', type: 'stack' }, ctx);
    const ids = service.allInstances().map(i => i.id);
    expect(ids).toContain('i1');
    expect(ids).toContain('i2');
  });
});
