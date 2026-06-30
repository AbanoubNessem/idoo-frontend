import { TestBed } from '@angular/core/testing';
import { LayoutRegistryService } from '../layout-registry.service';
import { LayoutDefinition } from '../layout.types';

const makeDef = (id: string): LayoutDefinition => ({ id, type: 'grid' });

describe('LayoutRegistryService', () => {
  let service: LayoutRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutRegistryService);
  });

  it('registers a definition', () => {
    service.register(makeDef('a'));
    expect(service.has('a')).toBeTrue();
  });

  it('retrieves a registered definition', () => {
    const def = makeDef('b');
    service.register(def);
    expect(service.get('b')).toEqual(def);
  });

  it('returns null for unknown id', () => {
    expect(service.get('unknown')).toBeNull();
  });

  it('registerAll registers multiple definitions', () => {
    service.registerAll([makeDef('x'), makeDef('y')]);
    expect(service.has('x')).toBeTrue();
    expect(service.has('y')).toBeTrue();
  });

  it('unregisters a definition', () => {
    service.register(makeDef('c'));
    service.unregister('c');
    expect(service.has('c')).toBeFalse();
  });

  it('size() returns count of registered definitions', () => {
    service.registerAll([makeDef('p'), makeDef('q')]);
    expect(service.size()).toBeGreaterThanOrEqual(2);
  });

  it('clear() empties the registry', () => {
    service.register(makeDef('z'));
    service.clear();
    expect(service.size()).toBe(0);
  });

  it('byTag returns definitions with matching tag', () => {
    service.register(makeDef('tagged'), { tags: ['form'] });
    service.register(makeDef('untagged'));
    const results = service.byTag('form');
    expect(results.some(d => d.id === 'tagged')).toBeTrue();
    expect(results.some(d => d.id === 'untagged')).toBeFalse();
  });
});
