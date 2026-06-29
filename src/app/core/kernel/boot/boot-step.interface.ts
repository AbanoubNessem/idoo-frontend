import { BootContext, BootStepResult } from '../kernel.types';

export interface IBootStep {
  readonly stepId: string;
  readonly stepName: string;
  readonly order: number;
  readonly critical: boolean;

  execute(ctx: BootContext): Promise<BootStepResult>;
  canSkip(ctx: BootContext): boolean;
  onError(ctx: BootContext, error: Error): Promise<void>;
}

export function buildStepResult(
  stepId: string,
  startMs: number,
  success: boolean,
  options: {
    error?: Error;
    warnings?: string[];
    metadata?: Record<string, unknown>;
  } = {},
): BootStepResult {
  return {
    stepId,
    success,
    durationMs: performance.now() - startMs,
    error: options.error,
    warnings: options.warnings ?? [],
    metadata: options.metadata ?? {},
  };
}
