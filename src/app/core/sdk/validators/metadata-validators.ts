import { ValidationResult, ValidationIssue } from './sdk-validation-error';
import { EntityDef } from '../../registry/registries/entity.registry';
import { FormDef } from '../../registry/registries/form.registry';
import { TableDef } from '../../registry/registries/table.registry';
import { WorkflowDef } from '../../registry/registries/workflow.registry';
import { PluginManifest } from '../../plugin/plugin-manifest.model';

const ENTITY_ID_PATTERN = /^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/;
const API_PATH_PATTERN = /^\/v\d+\//;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const PERMISSION_CODE_PATTERN = /^[A-Z0-9_]+:[A-Z0-9_]+:[A-Z0-9_]+$/;
const PLUGIN_ID_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function issue(path: string, message: string, code: string, value?: unknown, hint?: string): ValidationIssue {
  return { path, message, code, value, hint };
}

export function validateEntity(def: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!def || typeof def !== 'object') {
    errors.push(issue('', 'EntityDef must be an object', 'INVALID_TYPE', def));
    return { valid: false, errors, warnings };
  }

  const d = def as Partial<EntityDef>;

  if (!d.id) {
    errors.push(issue('id', 'id is required', 'REQUIRED'));
  } else if (!ENTITY_ID_PATTERN.test(d.id)) {
    errors.push(issue('id', 'id must match pattern module:entity (lowercase)', 'PATTERN_MISMATCH', d.id, 'e.g., hr:employee'));
  }

  if (!d.apiPath) {
    errors.push(issue('apiPath', 'apiPath is required', 'REQUIRED'));
  } else if (!API_PATH_PATTERN.test(d.apiPath)) {
    errors.push(issue('apiPath', 'apiPath must start with /v{n}/', 'PATTERN_MISMATCH', d.apiPath, 'e.g., /v1/hr/employees'));
  }

  if (!d.labelSingular) errors.push(issue('labelSingular', 'labelSingular is required', 'REQUIRED'));
  if (!d.labelPlural) errors.push(issue('labelPlural', 'labelPlural is required', 'REQUIRED'));
  if (!d.labelField) errors.push(issue('labelField', 'labelField is required', 'REQUIRED'));
  if (!d.icon) warnings.push(issue('icon', 'icon is recommended', 'MISSING_OPTIONAL'));

  if (!d.permissions?.['list']) {
    errors.push(issue('permissions.list', 'permissions.list is required', 'MISSING_LIST_PERMISSION'));
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateForm(def: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!def || typeof def !== 'object') {
    errors.push(issue('', 'FormDef must be an object', 'INVALID_TYPE', def));
    return { valid: false, errors, warnings };
  }

  const d = def as Partial<FormDef>;

  if (!d.sections || !Array.isArray(d.sections) || d.sections.length === 0) {
    errors.push(issue('sections', 'form must have at least one section', 'EMPTY_ARRAY'));
  } else {
    const sectionIds = new Set<string>();
    d.sections.forEach((section, si) => {
      if (!section.id) {
        errors.push(issue(`sections[${si}].id`, 'section.id is required', 'REQUIRED'));
      } else if (sectionIds.has(section.id)) {
        errors.push(issue(`sections[${si}].id`, `Duplicate section id: ${section.id}`, 'DUPLICATE_ID', section.id));
      } else {
        sectionIds.add(section.id);
      }

      if (!section.fields || section.fields.length === 0) {
        errors.push(issue(`sections[${si}].fields`, 'Section has no fields', 'EMPTY_ARRAY'));
      } else {
        const fieldKeys = new Set<string>();
        section.fields.forEach((field, fi) => {
          if (!field.key) {
            errors.push(issue(`sections[${si}].fields[${fi}].key`, 'field.key is required', 'REQUIRED'));
          } else if (fieldKeys.has(field.key)) {
            errors.push(issue(`sections[${si}].fields[${fi}].key`, `Duplicate field key: ${field.key}`, 'DUPLICATE_ID'));
          } else {
            fieldKeys.add(field.key);
          }

          if (!field.label) warnings.push(issue(`sections[${si}].fields[${fi}].label`, 'field.label is recommended', 'MISSING_OPTIONAL'));

          if ((field.type === 'select' || field.type === 'multi-select') && !field['options'] && !field['optionsLoader']) {
            errors.push(issue(`sections[${si}].fields[${fi}]`, `select field '${field.key}' requires options or optionsLoader`, 'MISSING_OPTIONS'));
          }

          if (field.type === 'entity-picker' && !field['entityRef']) {
            errors.push(issue(`sections[${si}].fields[${fi}]`, `entity-picker '${field.key}' requires entityRef`, 'MISSING_ENTITY_REF'));
          }
        });
      }
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateTable(def: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!def || typeof def !== 'object') {
    errors.push(issue('', 'TableDef must be an object', 'INVALID_TYPE', def));
    return { valid: false, errors, warnings };
  }

  const d = def as Partial<TableDef>;

  if (!d.columns || !Array.isArray(d.columns) || d.columns.length === 0) {
    errors.push(issue('columns', 'table must have at least one column', 'EMPTY_ARRAY'));
  }

  if (d.pageSize !== undefined && (d.pageSize < 5 || d.pageSize > 200)) {
    errors.push(issue('pageSize', 'pageSize must be between 5 and 200', 'INVALID_PAGE_SIZE', d.pageSize));
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateWorkflow(def: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!def || typeof def !== 'object') {
    errors.push(issue('', 'WorkflowDef must be an object', 'INVALID_TYPE', def));
    return { valid: false, errors, warnings };
  }

  const d = def as Partial<WorkflowDef>;

  if (!d.entityId) errors.push(issue('entityId', 'entityId is required', 'REQUIRED'));
  if (!d.initialState) errors.push(issue('initialState', 'initialState is required', 'REQUIRED'));
  if (!d.states || d.states.length === 0) errors.push(issue('states', 'at least one state required', 'EMPTY_ARRAY'));
  if (!d.transitions || d.transitions.length === 0) errors.push(issue('transitions', 'at least one transition required', 'EMPTY_ARRAY'));

  return { valid: errors.length === 0, errors, warnings };
}

export function validatePlugin(manifest: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!manifest || typeof manifest !== 'object') {
    errors.push(issue('', 'PluginManifest must be an object', 'INVALID_TYPE'));
    return { valid: false, errors, warnings };
  }

  const m = manifest as Partial<PluginManifest>;

  if (!m.id) {
    errors.push(issue('id', 'id is required', 'REQUIRED'));
  } else if (!PLUGIN_ID_PATTERN.test(m.id)) {
    errors.push(issue('id', 'id must match UPPER_SNAKE_CASE (e.g. HR_MODULE)', 'PATTERN_MISMATCH', m.id));
  }
  if (!m.name) errors.push(issue('name', 'name is required', 'REQUIRED'));

  if (!m.version) {
    errors.push(issue('version', 'version is required', 'REQUIRED'));
  } else if (!SEMVER_PATTERN.test(m.version)) {
    errors.push(issue('version', 'version must be valid SemVer', 'INVALID_SEMVER', m.version));
  }

  if (!m.minimumPlatformVersion) {
    errors.push(issue('minimumPlatformVersion', 'minimumPlatformVersion is required', 'REQUIRED'));
  }

  if (!m.category) errors.push(issue('category', 'category is required', 'REQUIRED'));
  if (!m.author?.name) errors.push(issue('author.name', 'author.name is required', 'REQUIRED'));

  if (!m.entities?.length && !m.routes?.length && !m.widgets?.length) {
    warnings.push(issue('', 'Plugin contributes no entities, routes, or widgets', 'EMPTY_CONTRIBUTIONS'));
  }

  return { valid: errors.length === 0, errors, warnings };
}
