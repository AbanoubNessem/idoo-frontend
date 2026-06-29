import { Injectable, signal, computed } from '@angular/core';
import { PluginLifecycleState, PluginRuntimeEntry, PluginError } from './plugin.types';
import { PluginManifest } from './plugin-manifest.model';

type StateTransitions = Partial<Record<PluginLifecycleState, PluginLifecycleState[]>>;

const VALID_TRANSITIONS: StateTransitions = {
  DISCOVERED:   ['VALIDATED', 'FAILED'],
  VALIDATED:    ['RESOLVED', 'FAILED'],
  RESOLVED:     ['LOADED', 'FAILED'],
  LOADED:       ['INITIALIZED', 'FAILED'],
  INITIALIZED:  ['REGISTERED', 'FAILED'],
  REGISTERED:   ['READY', 'FAILED'],
  READY:        ['ACTIVE', 'DISABLED'],
  ACTIVE:       ['STOPPED', 'FAILED'],
  FAILED:       ['UNLOADED'],
  DISABLED:     ['READY', 'UNLOADED'],
  STOPPED:      ['ACTIVE', 'UNLOADED'],
  UNLOADED:     [],
};

@Injectable({ providedIn: 'root' })
export class PluginLifecycleService {
  private readonly _entries = signal<Map<string, PluginRuntimeEntry>>(new Map());

  readonly entries = computed(() => this._entries());
  readonly allEntries = computed(() => Array.from(this._entries().values()));

  initialize(manifest: PluginManifest): void {
    this._entries.update(map => {
      const newMap = new Map(map);
      newMap.set(manifest.id, {
        manifest,
        state: 'DISCOVERED',
        bootResult: null,
        loadedAt: null,
        activeAt: null,
        error: null,
      });
      return newMap;
    });
  }

  transition(pluginId: string, to: PluginLifecycleState, error?: PluginError): void {
    this._entries.update(map => {
      const entry = map.get(pluginId);
      if (!entry) return map;

      const allowed = VALID_TRANSITIONS[entry.state];
      if (!allowed?.includes(to)) {
        console.warn(`Invalid plugin state transition: ${pluginId} ${entry.state} → ${to}`);
        return map;
      }

      const newMap = new Map(map);
      newMap.set(pluginId, {
        ...entry,
        state: to,
        error: error ?? null,
        loadedAt: to === 'LOADED' ? new Date().toISOString() : entry.loadedAt,
        activeAt: to === 'ACTIVE' ? new Date().toISOString() : entry.activeAt,
      });
      return newMap;
    });
  }

  getState(pluginId: string): PluginLifecycleState | undefined {
    return this._entries().get(pluginId)?.state;
  }

  getEntry(pluginId: string): PluginRuntimeEntry | undefined {
    return this._entries().get(pluginId);
  }

  isInState(pluginId: string, state: PluginLifecycleState): boolean {
    return this.getState(pluginId) === state;
  }

  getActive(): PluginRuntimeEntry[] {
    return this.allEntries().filter(e => e.state === 'ACTIVE');
  }

  getFailed(): PluginRuntimeEntry[] {
    return this.allEntries().filter(e => e.state === 'FAILED');
  }

  canTransition(pluginId: string, to: PluginLifecycleState): boolean {
    const entry = this._entries().get(pluginId);
    if (!entry) return false;
    return VALID_TRANSITIONS[entry.state]?.includes(to) ?? false;
  }

  remove(pluginId: string): void {
    this._entries.update(map => {
      const newMap = new Map(map);
      newMap.delete(pluginId);
      return newMap;
    });
  }

  clear(): void {
    this._entries.set(new Map());
  }
}
