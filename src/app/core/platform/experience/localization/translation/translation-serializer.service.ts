import { Injectable } from '@angular/core';
import { TranslationNamespace, TranslationMap } from './translation.types';
import { TRANSLATION_SCHEMA_VERSION } from './translation.constants';

interface SerializedEnvelope {
  readonly schemaVersion: string;
  readonly serializedAt:  string;
  readonly namespace:     string;
  readonly locale:        string;
  readonly version?:      string;
  readonly data:          TranslationMap;
}

@Injectable({ providedIn: 'root' })
export class TranslationSerializerService {
  serialize(ns: TranslationNamespace): string {
    const envelope: SerializedEnvelope = {
      schemaVersion: TRANSLATION_SCHEMA_VERSION,
      serializedAt:  new Date().toISOString(),
      namespace:     ns.namespace,
      locale:        ns.locale,
      version:       ns.version,
      data:          ns.data,
    };
    return JSON.stringify(envelope, null, 2);
  }

  deserialize(json: string): TranslationNamespace {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('TranslationSerializer: Invalid JSON.');
    }

    const env = parsed as Partial<SerializedEnvelope>;

    // Envelope format
    if (env.namespace && env.locale && env.data) {
      return {
        namespace: env.namespace,
        locale:    env.locale,
        data:      env.data,
        version:   env.version,
        loadedAt:  env.serializedAt,
      };
    }

    // Bare { locale, data } format
    const bare = parsed as { locale?: string; data?: TranslationMap; namespace?: string };
    if (bare.locale && bare.data) {
      return {
        namespace: bare.namespace ?? 'common',
        locale:    bare.locale,
        data:      bare.data,
      };
    }

    throw new Error('TranslationSerializer: JSON does not contain a valid TranslationNamespace.');
  }

  /** Flatten a nested TranslationMap into dot-path keys */
  flatten(data: TranslationMap, prefix = ''): Record<string, string> {
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        flat[key] = v;
      } else if (typeof v === 'object' && v !== null) {
        Object.assign(flat, this.flatten(v as TranslationMap, key));
      }
    }
    return flat;
  }

  /** Reconstruct a nested map from dot-path keys */
  unflatten(flat: Record<string, string>): TranslationMap {
    const result: Record<string, unknown> = {};
    for (const [dotKey, val] of Object.entries(flat)) {
      const parts  = dotKey.split('.');
      let   cursor = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (typeof cursor[p] !== 'object' || cursor[p] === null) {
          cursor[p] = {};
        }
        cursor = cursor[p] as Record<string, unknown>;
      }
      cursor[parts[parts.length - 1]] = val;
    }
    return result as TranslationMap;
  }

  mergeNamespaces(base: TranslationMap, override: TranslationMap): TranslationMap {
    const result: TranslationMap = { ...base };
    for (const [k, v] of Object.entries(override)) {
      if (
        typeof v === 'object' &&
        typeof (result[k] as unknown) === 'object' &&
        result[k] !== null
      ) {
        result[k] = this.mergeNamespaces(result[k] as TranslationMap, v as TranslationMap);
      } else {
        result[k] = v;
      }
    }
    return result;
  }
}
