import { Injectable, inject } from '@angular/core';
import { LayoutDiagnosticsReport, LayoutInstanceSummary } from './layout.types';
import { LAYOUT_DIAGNOSTICS_ENABLED } from './layout.tokens';
import { LayoutMetricsService } from './layout-metrics.service';
import { LayoutRegistryService } from './layout-registry.service';
import { LayoutFactoryService } from './layout-factory.service';

@Injectable({ providedIn: 'root' })
export class LayoutDiagnosticsService {
  private readonly _enabled    = inject(LAYOUT_DIAGNOSTICS_ENABLED);
  private readonly _metrics    = inject(LayoutMetricsService);
  private readonly _registry   = inject(LayoutRegistryService);
  private readonly _factory    = inject(LayoutFactoryService);

  report(): LayoutDiagnosticsReport {
    const instances = this._factory.allInstances();
    const snapshots = this._metrics.allSnapshots();

    const summaries: LayoutInstanceSummary[] = instances.map(inst => {
      const snap = snapshots.find(s => s.instanceId === inst.id);
      return {
        id:          inst.id,
        type:        inst.definition.type,
        phase:       inst.phase,
        renderCount: snap?.renderCount ?? 0,
        breakpoint:  inst.resolved?.breakpoint ?? 'md',
      };
    });

    return {
      totalInstances:        instances.length,
      activeInstances:       instances.filter(i => i.phase === 'ready').length,
      registeredDefinitions: this._registry.size(),
      diagnosticsEnabled:    this._enabled,
      instanceSummaries:     summaries,
      generatedAt:           new Date().toISOString(),
    };
  }

  logReport(): void {
    if (!this._enabled) return;
    console.group('[LayoutDiagnostics]');
    console.table(this.report().instanceSummaries);
    console.groupEnd();
  }
}
