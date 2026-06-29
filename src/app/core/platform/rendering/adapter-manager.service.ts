import { Injectable, inject, signal, computed } from '@angular/core';
import { AdapterConfig, AdapterType } from './rendering.types';
import { UIAdapter } from './adapters/adapter.interface';
import { MaterialAdapter } from './adapters/material.adapter';
import { RenderEventsService } from './render-events.service';

@Injectable({ providedIn: 'root' })
export class AdapterManagerService {
  private readonly material = inject(MaterialAdapter);
  private readonly events = inject(RenderEventsService);

  private readonly _adapters = new Map<AdapterType, UIAdapter>();
  private readonly _activeType = signal<AdapterType>('material');

  readonly activeAdapterType = computed(() => this._activeType());
  readonly activeAdapter = computed(() => this._adapters.get(this._activeType()) ?? this.material);

  constructor() {
    this._adapters.set('material', this.material);
  }

  registerAdapter(adapter: UIAdapter): void {
    this._adapters.set(adapter.type, adapter);
  }

  setActiveAdapter(type: AdapterType): void {
    if (!this._adapters.has(type)) {
      throw new Error(`AdapterManager: adapter "${type}" is not registered`);
    }
    const previous = this._activeType();
    this._activeType.set(type);
    this.events.emit('adapter:changed', { from: previous, to: type });
  }

  getAdapter(type?: AdapterType): UIAdapter {
    const target = type ?? this._activeType();
    return this._adapters.get(target) ?? this.material;
  }

  isAdapterAvailable(type: AdapterType): boolean {
    return (this._adapters.get(type)?.isAvailable ?? false);
  }

  configure(config: AdapterConfig): void {
    const adapter = this._adapters.get(config.type);
    if (adapter) adapter.configure(config);
  }

  getRegisteredTypes(): AdapterType[] {
    return Array.from(this._adapters.keys());
  }
}
