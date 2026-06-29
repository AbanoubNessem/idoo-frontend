import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RuleEngineService } from './rule-engine.service';
import { ExpressionEngineService } from './expression-engine.service';
import { ExpressionContext } from '../runtime.types';

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  const ctx: ExpressionContext = { model: { status: 'ACTIVE', amount: 100 } };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RuleEngineService, ExpressionEngineService],
    });
    service = TestBed.inject(RuleEngineService);
    service.clear();
  });

  it('should register and evaluate a rule with function condition', () => {
    const actionCalled: boolean[] = [];
    service.register({
      id: 'r1',
      condition: (c) => c.model['status'] === 'ACTIVE',
      action: () => { actionCalled.push(true); },
    });
    const results = service.evaluate(ctx);
    expect(results[0].matched).toBe(true);
    expect(results[0].actionExecuted).toBe(true);
    expect(actionCalled.length).toBe(1);
  });

  it('should not match when condition is false', () => {
    service.register({
      id: 'r2',
      condition: (c) => c.model['status'] === 'INACTIVE',
      action: () => {},
    });
    const results = service.evaluate(ctx);
    expect(results[0].matched).toBe(false);
    expect(results[0].actionExecuted).toBe(false);
  });

  it('should evaluate first matching rule', () => {
    const hits: string[] = [];
    service.register({ id: 'a', condition: () => true, action: () => { hits.push('a'); } });
    service.register({ id: 'b', condition: () => true, action: () => { hits.push('b'); } });
    const first = service.evaluateFirst(ctx);
    expect(first?.matched).toBe(true);
  });

  it('should unregister a rule', () => {
    service.register({ id: 'x', condition: () => true, action: () => {} });
    service.unregister('x');
    expect(service.has('x')).toBe(false);
  });

  it('should list rule ids', () => {
    service.register({ id: 'r1', condition: () => true, action: () => {} });
    service.register({ id: 'r2', condition: () => false, action: () => {} });
    expect(service.listRuleIds()).toContain('r1');
    expect(service.listRuleIds()).toContain('r2');
  });

  it('should clear all rules', () => {
    service.register({ id: 'c1', condition: () => true, action: () => {} });
    service.clear();
    expect(service.listRuleIds()).toHaveLength(0);
  });
});
