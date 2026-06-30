import { Injectable, inject } from '@angular/core';
import {
  ExperienceProfile, SerializedExperienceProfile, ExperienceDimension,
  AnyExperienceProfile,
} from './experience.types';
import { EXPERIENCE_SCHEMA_VERSION } from './experience.constants';
import { ExperienceRegistryService } from './experience-registry.service';

@Injectable({ providedIn: 'root' })
export class ExperienceSerializerService {
  private readonly _registry = inject(ExperienceRegistryService);

  serialize(profile: ExperienceProfile): string {
    const payload: SerializedExperienceProfile = {
      schema:       EXPERIENCE_SCHEMA_VERSION,
      profile,
      serializedAt: new Date().toISOString(),
    };
    return JSON.stringify(payload, null, 2);
  }

  deserialize(json: string): ExperienceProfile {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('[ExperienceSerializer] Invalid JSON');
    }
    if (!this._isSerialized(parsed)) {
      throw new Error('[ExperienceSerializer] Unrecognized schema');
    }
    return parsed.profile;
  }

  serializeProfile<T extends AnyExperienceProfile>(profile: T): string {
    return JSON.stringify({ schema: EXPERIENCE_SCHEMA_VERSION, profile, serializedAt: new Date().toISOString() }, null, 2);
  }

  clone(profile: ExperienceProfile, newId: string): ExperienceProfile {
    return { ...this.deserialize(this.serialize(profile)), id: newId };
  }

  private _isSerialized(val: unknown): val is SerializedExperienceProfile {
    if (typeof val !== 'object' || val === null) return false;
    const obj = val as Record<string, unknown>;
    return (
      typeof obj['schema'] === 'string' &&
      typeof obj['profile'] === 'object' && obj['profile'] !== null &&
      typeof (obj['profile'] as Record<string, unknown>)['id'] === 'string'
    );
  }
}
