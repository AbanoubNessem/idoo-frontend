import { Injectable, inject } from '@angular/core';
import { Rule, RuleResult, ExpressionContext } from '../runtime.types';
import { ExpressionEngineService } from './expression-engine.service';

@Injectable({ providedIn: 'root' })
export class RuleEngineService {
  private readonly expressionEngine = inject(ExpressionEngineService);
  private readonly rules = new Map<string, Rule>();

  register(rule: Rule): void {
    this.rules.set(rule.id, rule);
  }

  unregister(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  evaluate(ctx: ExpressionContext, ruleIds?: string[]): RuleResult[] {
    const rulesToEvaluate = ruleIds
      ? ruleIds.map(id => this.rules.get(id)).filter((r): r is Rule => r !== undefined)
      : Array.from(this.rules.values()).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    return rulesToEvaluate.map(rule => this.evaluateRule(rule, ctx));
  }

  evaluateFirst(ctx: ExpressionContext, ruleIds?: string[]): RuleResult | null {
    const results = this.evaluate(ctx, ruleIds);
    return results.find(r => r.matched) ?? null;
  }

  private evaluateRule(rule: Rule, ctx: ExpressionContext): RuleResult {
    try {
      const matched = typeof rule.condition === 'function'
        ? rule.condition(ctx)
        : this.expressionEngine.evaluateBoolean(rule.condition, ctx);

      if (!matched) {
        return { ruleId: rule.id, matched: false, actionExecuted: false };
      }

      if (typeof rule.action === 'function') {
        rule.action(ctx);
      } else {
        this.expressionEngine.evaluate(rule.action, ctx);
      }

      return { ruleId: rule.id, matched: true, actionExecuted: true };
    } catch (err) {
      return {
        ruleId: rule.id,
        matched: false,
        actionExecuted: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  has(ruleId: string): boolean {
    return this.rules.has(ruleId);
  }

  clear(): void {
    this.rules.clear();
  }

  listRuleIds(): string[] {
    return Array.from(this.rules.keys());
  }
}
