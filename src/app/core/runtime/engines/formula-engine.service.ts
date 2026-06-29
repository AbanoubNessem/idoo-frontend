import { Injectable, inject } from '@angular/core';
import { FormulaResult, ExpressionContext } from '../runtime.types';
import { ExpressionEngineService } from './expression-engine.service';

export interface FormulaDefinition {
  id: string;
  expression: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class FormulaEngineService {
  private readonly expressionEngine = inject(ExpressionEngineService);
  private readonly formulas = new Map<string, FormulaDefinition>();

  register(id: string, expression: string, description?: string): void {
    this.formulas.set(id, { id, expression, description });
  }

  unregister(id: string): boolean {
    return this.formulas.delete(id);
  }

  evaluate(formulaId: string, ctx: ExpressionContext): unknown {
    const formula = this.formulas.get(formulaId);
    if (!formula) {
      throw new Error(`Formula '${formulaId}' is not registered`);
    }
    return this.expressionEngine.evaluate(formula.expression, ctx);
  }

  evaluateWrapped(formulaId: string, ctx: ExpressionContext): FormulaResult {
    const formula = this.formulas.get(formulaId);
    if (!formula) {
      return { formula: formulaId, value: undefined, error: `Formula '${formulaId}' not registered` };
    }
    return this.evaluateExpression(formula.expression, ctx);
  }

  evaluateExpression(expression: string, ctx: ExpressionContext): FormulaResult {
    try {
      const value = this.expressionEngine.evaluate(expression, ctx);
      return { formula: expression, value };
    } catch (err) {
      return {
        formula: expression,
        value: undefined,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  evaluateAll(ctx: ExpressionContext): Map<string, unknown> {
    const results = new Map<string, unknown>();
    for (const [id, formula] of this.formulas.entries()) {
      try {
        results.set(id, this.expressionEngine.evaluate(formula.expression, ctx));
      } catch {
        results.set(id, undefined);
      }
    }
    return results;
  }

  calculateField(
    fields: Record<string, unknown>,
    targetField: string,
    expression: string,
  ): FormulaResult {
    const ctx: ExpressionContext = { model: fields };
    const result = this.evaluateExpression(expression, ctx);
    if (result.error === undefined) {
      fields[targetField] = result.value;
    }
    return result;
  }

  has(id: string): boolean {
    return this.formulas.has(id);
  }

  listFormulas(): string[] {
    return Array.from(this.formulas.keys());
  }

  clear(): void {
    this.formulas.clear();
  }

  clearAll(): void {
    this.formulas.clear();
  }
}
