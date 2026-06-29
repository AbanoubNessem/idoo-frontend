import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ExpressionEngineService } from './expression-engine.service';

describe('ExpressionEngineService', () => {
  let service: ExpressionEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ExpressionEngineService] });
    service = TestBed.inject(ExpressionEngineService);
  });

  it('should evaluate a simple arithmetic expression', () => {
    const result = service.evaluate('model.a + model.b', { model: { a: 3, b: 4 } });
    expect(result).toBe(7);
  });

  it('should evaluate a boolean expression', () => {
    const result = service.evaluate('model.status === "ACTIVE"', { model: { status: 'ACTIVE' } });
    expect(result).toBe(true);
  });

  it('should evaluate a ternary expression', () => {
    const result = service.evaluate('model.qty > 0 ? "yes" : "no"', { model: { qty: 5 } });
    expect(result).toBe('yes');
  });

  it('should return undefined for invalid expression', () => {
    const result = service.evaluate('undeclared_var.something', { model: {} });
    expect(result).toBeUndefined();
  });

  it('should access nested properties', () => {
    const result = service.evaluate('model.user.name', { model: { user: { name: 'Alice' } } });
    expect(result).toBe('Alice');
  });

  it('should handle array access', () => {
    const result = service.evaluate('model.items[0]', { model: { items: ['first', 'second'] } });
    expect(result).toBe('first');
  });

  it('should evaluate string concat', () => {
    const result = service.evaluate('model.first + " " + model.last', { model: { first: 'John', last: 'Doe' } });
    expect(result).toBe('John Doe');
  });

  it('should validate a correct expression', () => {
    const result = service.validate('1 + 1');
    expect(result.valid).toBe(true);
  });

  it('should fail validation on syntax error', () => {
    const result = service.validate('model.(broken syntax');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
