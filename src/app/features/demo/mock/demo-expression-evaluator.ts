import { Injectable } from '@angular/core';
import { FormExpressionEvaluator } from '../../../core/platform/forms/form.types';

/**
 * DemoExpressionEvaluator — evaluates field expressions against the form model.
 * Uses Function constructor for flexibility in the demo environment.
 * In production, replace with the platform Expression Engine (Sprint 7+).
 */
@Injectable()
export class DemoExpressionEvaluator implements FormExpressionEvaluator {

  evaluate(expression: string, context: Record<string, unknown>): unknown {
    if (!expression?.trim()) return undefined;
    try {
      const keys   = Object.keys(context);
      const values = Object.values(context);
      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `"use strict"; try { return (${expression}); } catch { return undefined; }`);
      return fn(...values);
    } catch {
      return undefined;
    }
  }

  evaluateBoolean(expression: string, context: Record<string, unknown>): boolean {
    if (!expression?.trim()) return false;
    return Boolean(this.evaluate(expression, context));
  }
}
