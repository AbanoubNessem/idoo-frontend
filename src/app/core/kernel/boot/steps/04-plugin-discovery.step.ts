import { BootContext } from '../../kernel.types';
import { IBootStep, buildStepResult } from '../boot-step.interface';

export class PluginDiscoveryStep implements IBootStep {
  readonly stepId = '04-plugin-discovery';
  readonly stepName = 'Plugin Discovery';
  readonly order = 4;
  readonly critical = false;

  async execute(ctx: BootContext) {
    const start = performance.now();
    const warnings: string[] = [];

    try {
      // Plugins are discovered via PLUGIN_MANIFEST_TOKEN multi-provider.
      // The PluginHost reads all manifests registered through providePlugin().
      // Discovery count is populated by PluginHost during its initialization.
      if (ctx.discoveredManifestIds.length === 0) {
        warnings.push('No plugins discovered. The platform will run without ERP modules.');
      }

      return buildStepResult(this.stepId, start, true, {
        warnings,
        metadata: {
          discoveredCount: ctx.discoveredManifestIds.length,
          pluginIds: ctx.discoveredManifestIds,
        },
      });
    } catch (error) {
      ctx.isDegraded = true;
      return buildStepResult(this.stepId, start, false, {
        error: error instanceof Error ? error : new Error(String(error)),
        warnings,
      });
    }
  }

  canSkip(ctx: BootContext): boolean {
    return ctx.discoveredManifestIds.length === 0;
  }

  async onError(ctx: BootContext, error: Error): Promise<void> {
    ctx.warnings.push(`Plugin discovery failed: ${error.message}. Continuing in degraded mode.`);
    ctx.isDegraded = true;
  }
}
