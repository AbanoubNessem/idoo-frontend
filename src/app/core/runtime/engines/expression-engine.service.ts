import { Injectable } from '@angular/core';
import { ExpressionContext, FormulaResult } from '../runtime.types';

type ExpressionFn = (ctx: ExpressionContext) => unknown;

@Injectable({ providedIn: 'root' })
export class ExpressionEngineService {
  private readonly cache = new Map<string, ExpressionFn>();

  evaluate(expression: string, ctx: ExpressionContext): unknown {
    try {
      const fn = this.compile(expression);
      return fn(ctx);
    } catch {
      return undefined;
    }
  }

  evaluateBoolean(expression: string, ctx: ExpressionContext): boolean {
    try {
      return Boolean(this.evaluate(expression, ctx));
    } catch {
      return false;
    }
  }

  evaluateString(expression: string, ctx: ExpressionContext): string {
    try {
      return String(this.evaluate(expression, ctx) ?? '');
    } catch {
      return '';
    }
  }

  evaluateNumber(expression: string, ctx: ExpressionContext): number {
    try {
      return Number(this.evaluate(expression, ctx) ?? 0);
    } catch {
      return 0;
    }
  }

  interpolate(template: string, ctx: ExpressionContext): string {
    return template.replace(/\{\{(.+?)\}\}/g, (_, expr: string) => {
      const result = this.evaluate(expr.trim(), ctx);
      return result !== undefined && result !== null ? String(result) : '';
    });
  }

  compile(expression: string): ExpressionFn {
    if (this.cache.has(expression)) {
      return this.cache.get(expression)!;
    }

    const fn = this.buildFn(expression);
    this.cache.set(expression, fn);
    return fn;
  }

  private buildFn(expression: string): ExpressionFn {
    try {
      // Safe expression evaluator using model field access
      // Supports: field references, comparisons, logical operators, ternary
      const sanitized = expression
        .replace(/\bmodel\./g, 'ctx.model.')
        .replace(/\buser\./g, 'ctx.user?.')
        .replace(/\benv\./g, 'ctx.env?.');

      // eslint-disable-next-line no-new-func
      return new Function('ctx', `"use strict"; try { return (${sanitized}); } catch(e) { return undefined; }`) as ExpressionFn;
    } catch {
      return () => undefined;
    }
  }

  validate(expression: string): { valid: boolean; error?: string } {
    try {
      const sanitized = expression
        .replace(/\bmodel\./g, 'ctx.model.')
        .replace(/\buser\./g, 'ctx.user?.')
        .replace(/\benv\./g, 'ctx.env?.');
      // eslint-disable-next-line no-new-func
      new Function('ctx', `"use strict"; return (${sanitized});`);
      return { valid: true };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}
