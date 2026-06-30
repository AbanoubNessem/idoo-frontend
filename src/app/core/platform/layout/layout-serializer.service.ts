import { Injectable, inject } from '@angular/core';
import { LayoutDefinition, SerializedLayout } from './layout.types';
import { LayoutRegistryService } from './layout-registry.service';
import { LAYOUT_SCHEMA_VERSION } from './layout.constants';

@Injectable({ providedIn: 'root' })
export class LayoutSerializerService {
  private readonly _registry = inject(LayoutRegistryService);

  serialize(definition: LayoutDefinition): string {
    const payload: SerializedLayout = {
      schema:       LAYOUT_SCHEMA_VERSION,
      definition,
      serializedAt: new Date().toISOString(),
    };
    return JSON.stringify(payload, null, 2);
  }

  deserialize(json: string): LayoutDefinition {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('[LayoutSerializer] Invalid JSON');
    }

    if (!this._isSerializedLayout(parsed)) {
      throw new Error('[LayoutSerializer] Unrecognized schema');
    }

    return parsed.definition;
  }

  serializeAndRegister(definition: LayoutDefinition): string {
    const json = this.serialize(definition);
    this._registry.register(definition);
    return json;
  }

  deserializeAndRegister(json: string): LayoutDefinition {
    const def = this.deserialize(json);
    this._registry.register(def);
    return def;
  }

  clone(definition: LayoutDefinition, newId: string): LayoutDefinition {
    const json = this.serialize(definition);
    const cloned = this.deserialize(json);
    return { ...cloned, id: newId };
  }

  private _isSerializedLayout(val: unknown): val is SerializedLayout {
    if (typeof val !== 'object' || val === null) return false;
    const obj = val as Record<string, unknown>;
    return (
      typeof obj['schema'] === 'string' &&
      typeof obj['definition'] === 'object' && obj['definition'] !== null &&
      typeof (obj['definition'] as Record<string, unknown>)['id'] === 'string'
    );
  }
}
