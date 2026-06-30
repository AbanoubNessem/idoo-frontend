import { TestBed } from '@angular/core/testing';
import { TableFilterRegistry } from '../table-filter-registry.service';
import { TableFilterCondition } from '../table-data.types';

const cond: TableFilterCondition = {
  columnId: 'x', field: 'x', operator: 'custom', value: 42,
};

describe('TableFilterRegistry', () => {
  let service: TableFilterRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableFilterRegistry);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('should start empty', () => {
    expect(service.registeredCount()).toBe(0);
  });

  it('getPredicate() should return null for unknown id', () => {
    expect(service.getPredicate('unknown')).toBeNull();
  });

  it('hasPredicate() should return false for unknown id', () => {
    expect(service.hasPredicate('my-pred')).toBeFalse();
  });

  it('registerPredicate() should register a predicate', () => {
    service.registerPredicate('my-pred', (v) => v === 42);
    expect(service.hasPredicate('my-pred')).toBeTrue();
  });

  it('getPredicate() should return registered predicate', () => {
    const fn = (v: unknown) => Number(v) > 0;
    service.registerPredicate('positive', fn);
    expect(service.getPredicate('positive')).toBe(fn);
  });

  it('registered predicate should evaluate correctly', () => {
    service.registerPredicate('eq-42', (v) => v === 42);
    expect(service.getPredicate('eq-42')!(42, cond)).toBeTrue();
    expect(service.getPredicate('eq-42')!(1,  cond)).toBeFalse();
  });

  it('registeredCount should track registered predicates', () => {
    service.registerPredicate('a', () => true);
    service.registerPredicate('b', () => true);
    expect(service.registeredCount()).toBe(2);
  });

  it('removePredicate() should remove by id', () => {
    service.registerPredicate('temp', () => true);
    service.removePredicate('temp');
    expect(service.hasPredicate('temp')).toBeFalse();
  });

  it('list() should include all registered ids', () => {
    service.registerPredicate('x1', () => true);
    service.registerPredicate('x2', () => true);
    expect(service.list()).toContain('x1');
    expect(service.list()).toContain('x2');
  });

  it('registeredCount should decrease after remove', () => {
    service.registerPredicate('z', () => true);
    const before = service.registeredCount();
    service.removePredicate('z');
    expect(service.registeredCount()).toBe(before - 1);
  });
});
