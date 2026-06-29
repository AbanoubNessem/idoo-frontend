import { Injectable } from '@angular/core';
import {
  MetadataEntry,
  MetadataType,
  MetadataValidationError,
  MetadataValidationResult,
} from './metadata.types';

type Validator = (entry: MetadataEntry) => MetadataValidationError[];

@Injectable({ providedIn: 'root' })
export class MetadataValidatorService {
  private readonly validators = new Map<MetadataType, Validator>([
    ['entity',       this.validateEntity.bind(this)],
    ['form',         this.validateForm.bind(this)],
    ['table',        this.validateTable.bind(this)],
    ['route',        this.validateRoute.bind(this)],
    ['menu',         this.validateMenu.bind(this)],
    ['action',       this.validateAction.bind(this)],
    ['permission',   this.validatePermission.bind(this)],
    ['lookup',       this.validateLookup.bind(this)],
    ['workflow',     this.validateWorkflow.bind(this)],
    ['dashboard',    this.validateDashboard.bind(this)],
    ['widget',       this.validateWidget.bind(this)],
    ['report',       this.validateReport.bind(this)],
    ['validator',    this.validateValidatorDef.bind(this)],
    ['layout',       this.validateLayout.bind(this)],
    ['theme',        this.validateTheme.bind(this)],
    ['localization', this.validateLocalization.bind(this)],
  ]);

  validateAll(entries: Map<string, MetadataEntry>): MetadataValidationResult {
    const errors: MetadataValidationError[] = [];
    const warnings: MetadataValidationError[] = [];

    for (const entry of entries.values()) {
      const newErrors = this.validateEntry(entry);
      for (const e of newErrors) {
        if (e.severity === 'error') errors.push(e);
        else warnings.push(e);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateEntry(entry: MetadataEntry): MetadataValidationError[] {
    const validator = this.validators.get(entry.type);
    if (!validator) return [];

    return [
      ...entry.validationErrors,
      ...validator(entry),
    ];
  }

  applyValidation(entries: Map<string, MetadataEntry>): Map<string, MetadataEntry> {
    const updated = new Map<string, MetadataEntry>();

    for (const [key, entry] of entries.entries()) {
      const errors = this.validateEntry(entry);
      updated.set(key, {
        ...entry,
        validationErrors: errors,
        isValid: errors.filter(e => e.severity === 'error').length === 0,
      });
    }

    return updated;
  }

  private err(
    entry: MetadataEntry,
    field: string,
    message: string,
    code: string,
    severity: 'error' | 'warning' = 'error',
  ): MetadataValidationError {
    return { entryId: entry.id, type: entry.type, field, message, code, severity };
  }

  private validateEntity(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['apiPath']) errors.push(this.err(entry, 'apiPath', 'apiPath is required', 'ENTITY_MISSING_API_PATH'));
    if (!def['labelSingular']) errors.push(this.err(entry, 'labelSingular', 'labelSingular is required', 'ENTITY_MISSING_LABEL_SINGULAR'));
    if (!def['labelPlural']) errors.push(this.err(entry, 'labelPlural', 'labelPlural is required', 'ENTITY_MISSING_LABEL_PLURAL'));
    if (!def['icon']) errors.push(this.err(entry, 'icon', 'icon is required', 'ENTITY_MISSING_ICON', 'warning'));

    const perms = def['permissions'] as Record<string, string> | undefined;
    if (!perms?.['list']) errors.push(this.err(entry, 'permissions.list', 'permissions.list is required', 'ENTITY_MISSING_LIST_PERMISSION'));

    return errors;
  }

  private validateForm(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];
    const sections = def['sections'] as unknown[] | undefined;

    if (!sections || sections.length === 0) {
      errors.push(this.err(entry, 'sections', 'Form must have at least one section', 'FORM_NO_SECTIONS'));
    } else {
      const seenFieldKeys = new Set<string>();
      for (const section of sections as Array<Record<string, unknown>>) {
        const fields = section['fields'] as Array<Record<string, unknown>> | undefined;
        if (!fields || fields.length === 0) {
          errors.push(this.err(entry, 'sections.fields', `Section "${section['id']}" has no fields`, 'FORM_SECTION_EMPTY', 'warning'));
          continue;
        }
        for (const field of fields) {
          const key = field['key'] as string;
          if (!key) {
            errors.push(this.err(entry, 'field.key', 'Field key is required', 'FORM_FIELD_MISSING_KEY'));
          } else if (seenFieldKeys.has(key)) {
            errors.push(this.err(entry, 'field.key', `Duplicate field key: ${key}`, 'FORM_FIELD_DUPLICATE_KEY'));
          } else {
            seenFieldKeys.add(key);
          }
          if (!field['label']) {
            errors.push(this.err(entry, 'field.label', `Field "${key}" is missing a label`, 'FORM_FIELD_MISSING_LABEL', 'warning'));
          }
        }
      }
    }

    return errors;
  }

  private validateTable(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];
    const columns = def['columns'] as unknown[] | undefined;

    if (!columns || columns.length === 0) {
      errors.push(this.err(entry, 'columns', 'Table must have at least one column', 'TABLE_NO_COLUMNS'));
    } else {
      const seenIds = new Set<string>();
      for (const col of columns as Array<Record<string, unknown>>) {
        const id = col['id'] as string;
        if (!id) {
          errors.push(this.err(entry, 'column.id', 'Column id is required', 'TABLE_COLUMN_MISSING_ID'));
        } else if (seenIds.has(id)) {
          errors.push(this.err(entry, 'column.id', `Duplicate column id: ${id}`, 'TABLE_COLUMN_DUPLICATE_ID'));
        } else {
          seenIds.add(id);
        }
      }
    }

    return errors;
  }

  private validateRoute(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['path']) errors.push(this.err(entry, 'path', 'Route path is required', 'ROUTE_MISSING_PATH'));
    if (!def['title']) errors.push(this.err(entry, 'title', 'Route title is required', 'ROUTE_MISSING_TITLE', 'warning'));

    return errors;
  }

  private validateMenu(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['label']) errors.push(this.err(entry, 'label', 'Menu label is required', 'MENU_MISSING_LABEL'));

    return errors;
  }

  private validateAction(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['label']) errors.push(this.err(entry, 'label', 'Action label is required', 'ACTION_MISSING_LABEL'));
    if (!def['type']) errors.push(this.err(entry, 'type', 'Action type is required', 'ACTION_MISSING_TYPE'));

    return errors;
  }

  private validatePermission(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['code']) errors.push(this.err(entry, 'code', 'Permission code is required', 'PERMISSION_MISSING_CODE'));
    if (!def['label']) errors.push(this.err(entry, 'label', 'Permission label is required', 'PERMISSION_MISSING_LABEL', 'warning'));

    return errors;
  }

  private validateLookup(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['label']) errors.push(this.err(entry, 'label', 'Lookup label is required', 'LOOKUP_MISSING_LABEL', 'warning'));

    const items = def['items'] as unknown[] | undefined;
    if (!items || items.length === 0) {
      errors.push(this.err(entry, 'items', 'Lookup must have at least one item', 'LOOKUP_NO_ITEMS', 'warning'));
    }

    return errors;
  }

  private validateWorkflow(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['initialState']) errors.push(this.err(entry, 'initialState', 'Workflow initialState is required', 'WORKFLOW_MISSING_INITIAL_STATE'));

    const states = def['states'] as Array<Record<string, unknown>> | undefined;
    if (!states || states.length === 0) {
      errors.push(this.err(entry, 'states', 'Workflow must have at least one state', 'WORKFLOW_NO_STATES'));
    } else if (def['initialState']) {
      const stateIds = new Set(states.map(s => s['id'] as string));
      if (!stateIds.has(def['initialState'] as string)) {
        errors.push(this.err(entry, 'initialState', `initialState "${def['initialState']}" does not exist in states`, 'WORKFLOW_INVALID_INITIAL_STATE'));
      }

      const transitions = def['transitions'] as Array<Record<string, unknown>> | undefined ?? [];
      for (const t of transitions) {
        if (t['from'] && !stateIds.has(t['from'] as string)) {
          errors.push(this.err(entry, 'transitions.from', `Transition from "${t['from']}" references unknown state`, 'WORKFLOW_INVALID_TRANSITION_FROM'));
        }
        if (t['to'] && !stateIds.has(t['to'] as string)) {
          errors.push(this.err(entry, 'transitions.to', `Transition to "${t['to']}" references unknown state`, 'WORKFLOW_INVALID_TRANSITION_TO'));
        }
      }
    }

    return errors;
  }

  private validateDashboard(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['title']) errors.push(this.err(entry, 'title', 'Dashboard title is required', 'DASHBOARD_MISSING_TITLE', 'warning'));

    return errors;
  }

  private validateWidget(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['name']) errors.push(this.err(entry, 'name', 'Widget name is required', 'WIDGET_MISSING_NAME'));

    return errors;
  }

  private validateReport(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['title']) errors.push(this.err(entry, 'title', 'Report title is required', 'REPORT_MISSING_TITLE', 'warning'));

    return errors;
  }

  private validateValidatorDef(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['defaultMessage'] && !def['message']) {
      errors.push(this.err(entry, 'defaultMessage', 'Validator must have a default message', 'VALIDATOR_MISSING_MESSAGE', 'warning'));
    }

    return errors;
  }

  private validateLayout(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['type']) errors.push(this.err(entry, 'type', 'Layout type is required', 'LAYOUT_MISSING_TYPE', 'warning'));

    return errors;
  }

  private validateTheme(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['name']) errors.push(this.err(entry, 'name', 'Theme name is required', 'THEME_MISSING_NAME', 'warning'));

    return errors;
  }

  private validateLocalization(entry: MetadataEntry): MetadataValidationError[] {
    const def = entry.definition as Record<string, unknown>;
    const errors: MetadataValidationError[] = [];

    if (!def['locale']) errors.push(this.err(entry, 'locale', 'Localization locale is required', 'LOCALIZATION_MISSING_LOCALE'));
    if (!def['translations']) errors.push(this.err(entry, 'translations', 'Localization translations are required', 'LOCALIZATION_MISSING_TRANSLATIONS'));

    return errors;
  }
}
