import { computed, inject, Injectable, signal } from '@angular/core';
import {
  AutosaveConfig,
  FormContextData,
  FormDefinition,
  FormEvent,
  FormEventType,
  FormInstance,
} from '../form.types';
import { DynamicFormFactoryService } from '../factory/dynamic-form-factory.service';
import { DynamicFormRegistryService } from '../registry/dynamic-form-registry.service';
import { DynamicFormLifecycleService } from '../lifecycle/dynamic-form-lifecycle.service';
import { DynamicFormDiagnosticsService } from '../diagnostics/dynamic-form-diagnostics.service';
import { DynamicFormMetricsService } from '../metrics/dynamic-form-metrics.service';
import { DynamicFormEventsService } from '../events/dynamic-form-events.service';
import { DynamicFormSnapshotService } from '../snapshot/dynamic-form-snapshot.service';
import { DynamicFormSerializerService } from '../serializer/dynamic-form-serializer.service';

// ─── DynamicFormEngine ────────────────────────────────────────────────────────
// The main facade for the Dynamic Form sub-system.
// Orchestrates: registry, factory, lifecycle, diagnostics, metrics, events, snapshots, serializer.
// MUST NOT contain business logic, rendering logic, or REST logic.

@Injectable({ providedIn: 'root' })
export class DynamicFormEngine {
  private readonly factory    = inject(DynamicFormFactoryService);
  private readonly registry   = inject(DynamicFormRegistryService);
  private readonly lifecycle  = inject(DynamicFormLifecycleService);
  private readonly diag       = inject(DynamicFormDiagnosticsService);
  private readonly metrics    = inject(DynamicFormMetricsService);
  private readonly events     = inject(DynamicFormEventsService);
  private readonly snapshots  = inject(DynamicFormSnapshotService);
  private readonly serializer = inject(DynamicFormSerializerService);

  private readonly _instances = signal<Map<string, FormInstance>>(new Map());

  readonly instanceCount = computed(() => this._instances().size);
  readonly activeIds     = computed(() => Array.from(this._instances().keys()));

  // ─── Service Facades ──────────────────────────────────────────────────────

  get Registry():   DynamicFormRegistryService   { return this.registry; }
  get Lifecycle():  DynamicFormLifecycleService  { return this.lifecycle; }
  get Diagnostics(): DynamicFormDiagnosticsService { return this.diag; }
  get Metrics():    DynamicFormMetricsService    { return this.metrics; }
  get Events():     DynamicFormEventsService     { return this.events; }
  get Snapshots():  DynamicFormSnapshotService   { return this.snapshots; }
  get Serializer(): DynamicFormSerializerService  { return this.serializer; }

  // ─── Instance Management ──────────────────────────────────────────────────

  async createForm(
    definition: FormDefinition,
    initialModel: Record<string, unknown> = {},
    contextData: Partial<FormContextData> = {},
  ): Promise<FormInstance> {
    const instance = await this.factory.create(definition, initialModel, contextData);
    this._instances.update(m => {
      const next = new Map(m);
      next.set(instance.id, instance);
      return next;
    });
    return instance;
  }

  async createFormByKey(
    formKey: string,
    initialModel: Record<string, unknown> = {},
    contextData: Partial<FormContextData> = {},
  ): Promise<FormInstance> {
    const definition = await this.registry.resolve(formKey);
    if (!definition) {
      throw new Error(`[DynamicFormEngine] Form "${formKey}" not found in registry.`);
    }
    return this.createForm(definition, initialModel, contextData);
  }

  getInstance(id: string): FormInstance | null {
    return this._instances().get(id) ?? null;
  }

  destroyInstance(id: string): void {
    const instance = this._instances().get(id);
    if (!instance) return;
    instance.destroy();
    this._instances.update(m => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
    this.metrics.reset(id);
    this.diag.clearForm(id);
    this.snapshots.clearForm(id);
  }

  destroyAll(): void {
    for (const id of this._instances().keys()) {
      this.destroyInstance(id);
    }
  }

  // ─── Form Registration Shortcuts ─────────────────────────────────────────

  registerForm(definition: FormDefinition, tags: string[] = []): void {
    this.registry.register(definition, { tags });
  }

  registerFormLazy(id: string, factory: () => Promise<FormDefinition>, tags: string[] = []): void {
    this.registry.registerLazy(id, factory, { tags });
  }

  // ─── Cross-Instance Queries ───────────────────────────────────────────────

  getSummary(): { id: string; valid: boolean; dirty: boolean; phase: string }[] {
    return Array.from(this._instances().values()).map(inst => ({
      id:    inst.id,
      valid: inst.isValid(),
      dirty: inst.isDirty(),
      phase: inst.getPhase(),
    }));
  }

  // ─── Diagnostics Shortcuts ────────────────────────────────────────────────

  enableDiagnostics(): void  { this.diag.enable(); }
  disableDiagnostics(): void { this.diag.disable(); }

  // ─── Autosave Helpers ─────────────────────────────────────────────────────

  configureAutosave(id: string, config: AutosaveConfig): void {
    this.getInstance(id)?.enableAutosave(config);
  }

  // ─── Event Shortcuts ──────────────────────────────────────────────────────

  on(
    formId: string,
    type: FormEventType | '*',
    handler: (event: FormEvent) => void,
  ): () => void {
    return this.events.on(formId, type, handler);
  }
}
