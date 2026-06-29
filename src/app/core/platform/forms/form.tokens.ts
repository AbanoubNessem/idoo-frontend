import { InjectionToken } from '@angular/core';
import {
  FormExpressionEvaluator,
  FormFieldValidator,
  FormPermissionChecker,
  FormQueryProvider,
  ValidatorSpec,
} from './form.types';

// ─── Injection Tokens ────────────────────────────────────────────────────────

export const FORM_EXPRESSION_EVALUATOR = new InjectionToken<FormExpressionEvaluator>(
  'FORM_EXPRESSION_EVALUATOR',
  { providedIn: 'root', factory: () => new NoopExpressionEvaluator() },
);

export const FORM_FIELD_VALIDATOR = new InjectionToken<FormFieldValidator>(
  'FORM_FIELD_VALIDATOR',
  { providedIn: 'root', factory: () => new NoopFieldValidator() },
);

export const FORM_PERMISSION_CHECKER = new InjectionToken<FormPermissionChecker>(
  'FORM_PERMISSION_CHECKER',
  { providedIn: 'root', factory: () => new NoopPermissionChecker() },
);

export const FORM_QUERY_PROVIDER = new InjectionToken<FormQueryProvider>(
  'FORM_QUERY_PROVIDER',
  { providedIn: 'root', factory: () => new NoopQueryProvider() },
);

// ─── Noop Default Implementations ────────────────────────────────────────────

class NoopExpressionEvaluator implements FormExpressionEvaluator {
  evaluate(_expression: string, _context: Record<string, unknown>): unknown {
    return undefined;
  }

  evaluateBoolean(_expression: string, _context: Record<string, unknown>): boolean {
    return false;
  }
}

class NoopFieldValidator implements FormFieldValidator {
  async validate(
    _value: unknown,
    _validators: ValidatorSpec[],
    _context: Record<string, unknown>,
  ): Promise<string[]> {
    return [];
  }
}

class NoopPermissionChecker implements FormPermissionChecker {
  hasPermission(_permission: string): boolean {
    return true;
  }

  hasAllPermissions(_permissions: string[]): boolean {
    return true;
  }
}

class NoopQueryProvider implements FormQueryProvider {
  async search(
    _query: string,
    _config: Record<string, unknown>,
    _context: Record<string, unknown>,
  ): Promise<unknown[]> {
    return [];
  }
}
