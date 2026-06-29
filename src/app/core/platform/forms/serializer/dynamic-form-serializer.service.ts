import { Injectable } from '@angular/core';
import { DynamicFormState } from '../state/dynamic-form-state';
import { FormDefinition, FormSerializationOptions, ResolvedFormModel } from '../form.types';

@Injectable({ providedIn: 'root' })
export class DynamicFormSerializerService {

  serialize(
    state: DynamicFormState,
    resolved: ResolvedFormModel,
    options: FormSerializationOptions = {},
  ): Record<string, unknown> {
    const model = state.model();
    const fieldStates = state.fieldStates();
    const result: Record<string, unknown> = {};
    const omit = new Set(options.omitKeys ?? []);

    for (const field of resolved.allFields) {
      const key = field.key;
      if (omit.has(key)) continue;

      const fieldState = fieldStates[key];
      if (!fieldState) continue;

      if (!options.includeHidden && fieldState.hidden) continue;
      if (!options.includeDisabled && fieldState.disabled) continue;
      if (options.dirtyOnly && !fieldState.dirty) continue;

      result[key] = model[key] ?? null;
    }

    return result;
  }

  deserialize(
    data: Record<string, unknown>,
    definition: FormDefinition,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const allKeys = this._extractAllFieldKeys(definition);

    for (const key of allKeys) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = data[key];
      }
    }

    return result;
  }

  toPatch(state: DynamicFormState, resolved: ResolvedFormModel): Record<string, unknown> {
    return this.serialize(state, resolved, { dirtyOnly: true });
  }

  toJSON(state: DynamicFormState, resolved: ResolvedFormModel): string {
    return JSON.stringify(this.serialize(state, resolved));
  }

  fromJSON(json: string): Record<string, unknown> {
    try {
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private _extractAllFieldKeys(definition: FormDefinition): string[] {
    const keys: string[] = [];

    const extractFromSections = (sections: FormDefinition['sections']): void => {
      for (const section of sections ?? []) {
        for (const field of section.fields ?? []) keys.push(field.key);
        for (const group of section.groups ?? []) {
          for (const f of group.fields) keys.push(f.key);
        }
        extractFromSections(section.subsections);
      }
    };

    extractFromSections(definition.sections);

    for (const tab of definition.tabs ?? []) {
      extractFromSections(tab.sections);
    }
    for (const step of definition.steps ?? []) {
      extractFromSections(step.sections);
    }

    return [...new Set(keys)];
  }
}
