// Contracts (types only)
export * from './contracts/index';

// Factory functions
export {
  definePlugin,
  defineEntity,
  defineForm,
  defineTable,
  defineAction,
  definePermission,
  defineMenu,
  defineRoute,
  defineWidget,
  defineDashboard,
  defineWorkflow,
  defineLookup,
  defineReport,
  defineValidator,
} from './define/define-functions';

// Builders
export { EntityBuilder } from './builders/entity.builder';
export { FormBuilder } from './builders/form.builder';

// Validators
export { SDKValidationError } from './validators/sdk-validation-error';
export type { ValidationResult, ValidationIssue } from './validators/sdk-validation-error';
export {
  validateEntity,
  validateForm,
  validateTable,
  validateWorkflow,
  validatePlugin,
} from './validators/metadata-validators';

// Helpers
export {
  withDefaults,
  pick,
  omit,
  extendForm,
  extendTable,
  createActionsColumn,
} from './helpers/metadata.helpers';

export {
  createPermissions,
  permissionDefsFromModule,
} from './helpers/permissions.helper';
