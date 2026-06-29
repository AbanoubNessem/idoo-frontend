import {
  Injectable, Type, inject, createComponent, EnvironmentInjector,
  ApplicationRef, ComponentRef, ModelSignal,
} from '@angular/core';
import { ComponentRegistryService } from './component-registry.service';
import { ComponentMetricsService } from '../metrics/component-metrics.service';

export interface ComponentInstance<T = unknown> {
  readonly ref: ComponentRef<T>;
  readonly instanceId: string;
  destroy(): void;
}

@Injectable({ providedIn: 'root' })
export class ComponentFactoryService {
  private readonly registry   = inject(ComponentRegistryService);
  private readonly metrics    = inject(ComponentMetricsService);
  private readonly injector   = inject(EnvironmentInjector);
  private readonly appRef     = inject(ApplicationRef);
  private _instanceCounter    = 0;

  /**
   * Creates a component instance for the given registered key.
   * The caller is responsible for attaching the host view and destroying on cleanup.
   */
  async create<T = unknown>(
    key: string,
    inputs: Record<string, unknown> = {},
  ): Promise<ComponentInstance<T>> {
    const componentType = await this.registry.resolve(key) as Type<T>;
    return this._instantiate(key, componentType, inputs);
  }

  /**
   * Creates a component instance directly from a type reference (no registry lookup).
   * Used internally by the playground and adapter connector.
   */
  createFromType<T = unknown>(
    componentType: Type<T>,
    key: string,
    inputs: Record<string, unknown> = {},
  ): ComponentInstance<T> {
    return this._instantiate(key, componentType, inputs);
  }

  private _instantiate<T>(
    key: string,
    componentType: Type<T>,
    inputs: Record<string, unknown>,
  ): ComponentInstance<T> {
    const instanceId = `${key}-${++this._instanceCounter}`;
    const start      = performance.now();

    const ref = createComponent<T>(componentType, {
      environmentInjector: this.injector,
    });

    this._applyInputs(ref, inputs);
    this.appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();

    this.metrics.recordRender(key, performance.now() - start);

    return {
      ref,
      instanceId,
      destroy: () => {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
      },
    };
  }

  private _applyInputs<T>(ref: ComponentRef<T>, inputs: Record<string, unknown>): void {
    for (const [k, v] of Object.entries(inputs)) {
      try {
        const signal = (ref.instance as Record<string, unknown>)[k];
        if (signal && typeof (signal as { set?: unknown }).set === 'function') {
          (signal as ModelSignal<unknown>).set(v);
        } else {
          ref.setInput(k, v);
        }
      } catch {
        ref.setInput(k, v);
      }
    }
  }
}
