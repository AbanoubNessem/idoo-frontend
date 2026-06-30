import { Injectable } from '@angular/core';
import { ThemeDefinition } from './theme.types';
import { THEME_SCHEMA_VERSION } from './theme.constants';

interface ThemeSerializedEnvelope {
  readonly schemaVersion: string;
  readonly serializedAt:  string;
  readonly theme:         ThemeDefinition;
}

@Injectable({ providedIn: 'root' })
export class ThemeSerializerService {
  serialize(theme: ThemeDefinition): string {
    const envelope: ThemeSerializedEnvelope = {
      schemaVersion: THEME_SCHEMA_VERSION,
      serializedAt:  new Date().toISOString(),
      theme,
    };
    return JSON.stringify(envelope, null, 2);
  }

  deserialize(json: string): ThemeDefinition {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('ThemeSerializer: Invalid JSON input.');
    }

    const envelope = parsed as Partial<ThemeSerializedEnvelope>;

    if (!envelope.theme) {
      // Support bare theme objects (without envelope)
      const bare = parsed as Partial<ThemeDefinition>;
      if (!bare.id || !bare.tokens) {
        throw new Error('ThemeSerializer: JSON does not contain a valid theme definition.');
      }
      return bare as ThemeDefinition;
    }

    return envelope.theme;
  }

  serializeTokens(theme: ThemeDefinition): Record<string, string> {
    const flat: Record<string, string> = {};
    for (const [key, val] of Object.entries(theme.tokens.colors)) {
      if (val !== undefined) flat[`color.${key}`] = val;
    }
    for (const [key, val] of Object.entries(theme.tokens.spacing ?? {})) {
      if (val !== undefined) flat[`spacing.${key}`] = val;
    }
    for (const [key, val] of Object.entries(theme.tokens.radius ?? {})) {
      if (val !== undefined) flat[`radius.${key}`] = val;
    }
    for (const [key, val] of Object.entries(theme.tokens.elevation ?? {})) {
      if (val !== undefined) flat[`elevation.${key}`] = val;
    }
    for (const [key, val] of Object.entries(theme.tokens.breakpoints ?? {})) {
      if (val !== undefined) flat[`breakpoint.${key}`] = val;
    }
    for (const [key, val] of Object.entries(theme.tokens.custom ?? {})) {
      if (val !== undefined) flat[`custom.${key}`] = val;
    }
    return flat;
  }

  clone(theme: ThemeDefinition): ThemeDefinition {
    return JSON.parse(JSON.stringify(theme)) as ThemeDefinition;
  }
}
