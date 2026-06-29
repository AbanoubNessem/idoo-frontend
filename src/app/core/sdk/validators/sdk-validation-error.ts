export class SDKValidationError extends Error {
  constructor(
    public readonly factoryName: string,
    public readonly fieldPath: string,
    public readonly invalidValue: unknown,
    public readonly expectedType: string,
    public readonly hint?: string,
  ) {
    super(
      `[${factoryName}] Validation failed at '${fieldPath}': ` +
      `expected ${expectedType}, got ${JSON.stringify(invalidValue)}.` +
      (hint ? ` Hint: ${hint}` : ''),
    );
    this.name = 'SDKValidationError';
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  path: string;
  message: string;
  code: string;
  value?: unknown;
  hint?: string;
}
