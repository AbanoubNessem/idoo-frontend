import { Type } from '@angular/core';
import {
  AdapterType,
  FieldType,
  RenderContextData,
  RenderMode,
  ResolvedValidator,
} from './rendering.types';

export type ExpressionEvaluator = (expression: string, model: Record<string, unknown>) => unknown;
export type ValidatorResolver = (key: string) => ResolvedValidator | null;
export type ComponentResolver = (fieldType: FieldType | string) => Type<unknown> | null;

export class RenderContext {
  constructor(
    readonly data: Readonly<RenderContextData>,
    private readonly _getComponent: ComponentResolver,
    private readonly _evaluateExpression: ExpressionEvaluator,
    private readonly _resolveValidator: ValidatorResolver,
  ) {}

  // ─── Adapter ──────────────────────────────────────────────────────────────

  get adapter(): AdapterType {
    return this.data.adapter;
  }

  get mode(): RenderMode {
    return this.data.mode;
  }

  get locale(): string {
    return this.data.locale;
  }

  get model(): Record<string, unknown> {
    return this.data.model;
  }

  getComponent(fieldType: FieldType | string): Type<unknown> | null {
    return this._getComponent(fieldType);
  }

  // ─── Expressions ──────────────────────────────────────────────────────────

  evaluate(expression: string): unknown {
    try {
      return this._evaluateExpression(expression, this.data.model);
    } catch {
      return undefined;
    }
  }

  evaluateBoolean(expression: string): boolean {
    return Boolean(this.evaluate(expression));
  }

  evaluateString(expression: string): string {
    const result = this.evaluate(expression);
    return result !== null && result !== undefined ? String(result) : '';
  }

  // ─── Permissions ──────────────────────────────────────────────────────────

  hasPermission(code: string): boolean {
    return this.data.permissions.has(code);
  }

  hasAnyPermission(...codes: string[]): boolean {
    return codes.some(c => this.data.permissions.has(c));
  }

  hasAllPermissions(...codes: string[]): boolean {
    return codes.every(c => this.data.permissions.has(c));
  }

  // ─── Validators ───────────────────────────────────────────────────────────

  resolveValidator(key: string): ResolvedValidator | null {
    return this._resolveValidator(key);
  }

  resolveValidators(keys: ReadonlyArray<string>): ResolvedValidator[] {
    return keys
      .map(k => this._resolveValidator(k))
      .filter((v): v is ResolvedValidator => v !== null);
  }

  // ─── Factory ─────────────────────────────────────────────────────────────

  static create(
    data: Readonly<RenderContextData>,
    getComponent: ComponentResolver,
    evaluateExpression: ExpressionEvaluator,
    resolveValidator: ValidatorResolver,
  ): RenderContext {
    return new RenderContext(data, getComponent, evaluateExpression, resolveValidator);
  }

  withModel(model: Record<string, unknown>): RenderContext {
    return RenderContext.create(
      { ...this.data, model },
      this._getComponent,
      this._evaluateExpression,
      this._resolveValidator,
    );
  }
}
