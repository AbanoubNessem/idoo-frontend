import { Injectable } from '@angular/core';
import { BootContext, BootStepResult } from '../kernel.types';
import { IBootStep } from './boot-step.interface';
import { ConfigurationStep } from './steps/01-configuration.step';
import { StartupValidationStep } from './steps/02-startup-validation.step';
import { RegistryInitStep } from './steps/03-registry-init.step';
import { PluginDiscoveryStep } from './steps/04-plugin-discovery.step';
import { DependencyGraphStep } from './steps/05-dependency-graph.step';
import { PluginRegistrationStep } from './steps/06-plugin-registration.step';
import { SecurityInitStep } from './steps/07-security-init.step';
import { RouteBuildStep } from './steps/08-route-build.step';
import { ReadyStep } from './steps/09-ready.step';

export interface PipelineResult {
  success: boolean;
  isDegraded: boolean;
  stepResults: BootStepResult[];
  failedCriticalStep: string | null;
  totalDurationMs: number;
}

@Injectable({ providedIn: 'root' })
export class BootPipelineService {
  private readonly steps: IBootStep[] = [
    new ConfigurationStep(),
    new StartupValidationStep(),
    new RegistryInitStep(),
    new PluginDiscoveryStep(),
    new DependencyGraphStep(),
    new PluginRegistrationStep(),
    new SecurityInitStep(),
    new RouteBuildStep(),
    new ReadyStep(),
  ].sort((a, b) => a.order - b.order);

  async run(ctx: BootContext): Promise<PipelineResult> {
    const startMs = performance.now();
    const stepResults: BootStepResult[] = [];
    let failedCriticalStep: string | null = null;

    for (const step of this.steps) {
      if (step.canSkip(ctx)) {
        continue;
      }

      let result: BootStepResult;
      try {
        result = await step.execute(ctx);
      } catch (unexpectedError) {
        const error = unexpectedError instanceof Error
          ? unexpectedError
          : new Error(String(unexpectedError));

        result = {
          stepId: step.stepId,
          success: false,
          durationMs: 0,
          error,
          warnings: [],
          metadata: {},
        };
      }

      ctx.stepResults.set(step.stepId, result);
      stepResults.push(result);

      if (!result.success) {
        await step.onError(ctx, result.error ?? new Error('Unknown error'));

        if (step.critical) {
          failedCriticalStep = step.stepId;
          break;
        } else {
          ctx.isDegraded = true;
          ctx.warnings.push(...result.warnings);
        }
      } else {
        ctx.warnings.push(...result.warnings);
      }
    }

    return {
      success: failedCriticalStep === null,
      isDegraded: ctx.isDegraded,
      stepResults,
      failedCriticalStep,
      totalDurationMs: performance.now() - startMs,
    };
  }

  getStepIds(): string[] {
    return this.steps.map(s => s.stepId);
  }
}
