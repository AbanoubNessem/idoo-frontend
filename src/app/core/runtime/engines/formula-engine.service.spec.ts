import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormulaEngineService } from './formula-engine.service';
import { ExpressionEngineService } from './expression-engine.service';

describe('FormulaEngineService', () => {
  let service: FormulaEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaEngineService, ExpressionEngineService],
    });
    service = TestBed.inject(FormulaEngineService);
    service.clearAll();
  });

  it('should register and evaluate a formula', () => {
    service.register('totalPrice', 'model.qty * model.unitPrice');
    const result = service.evaluate('totalPrice', { model: { qty: 5, unitPrice: 20 } });
    expect(result).toBe(100);
  });

  it('should throw when formula not found', () => {
    expect(() => service.evaluate('unknown', { model: {} })).toThrow();
  });

  it('should unregister a formula', () => {
    service.register('f1', '1 + 1');
    service.unregister('f1');
    expect(service.has('f1')).toBe(false);
  });

  it('should list registered formula ids', () => {
    service.register('f1', '1');
    service.register('f2', '2');
    expect(service.listFormulas()).toContain('f1');
    expect(service.listFormulas()).toContain('f2');
  });

  it('should clear all formulas', () => {
    service.register('f1', '1');
    service.clearAll();
    expect(service.listFormulas()).toHaveLength(0);
  });

  it('should evaluate a string concat formula', () => {
    service.register('fullName', 'model.firstName + " " + model.lastName');
    const result = service.evaluate('fullName', { model: { firstName: 'John', lastName: 'Doe' } });
    expect(result).toBe('John Doe');
  });
});
