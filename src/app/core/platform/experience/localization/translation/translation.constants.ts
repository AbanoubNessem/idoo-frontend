/** Default namespace used when no namespace is specified in the key. */
export const DEFAULT_NAMESPACE = 'common';

/** Separator between namespace and key, e.g. 'forms:submit.label' */
export const NAMESPACE_SEPARATOR = ':';

/** Separator for dot-path key traversal, e.g. 'submit.label' */
export const KEY_SEPARATOR = '.';

/** Interpolation delimiters — matches {{param}} */
export const INTERPOLATION_OPEN  = '{{';
export const INTERPOLATION_CLOSE = '}}';

/** Pattern that matches {{anyKey}} */
export const INTERPOLATION_PATTERN = /\{\{(\s*[\w.]+\s*)\}\}/g;

/** Fallback locale when active locale translations are missing */
export const TRANSLATION_DEFAULT_FALLBACK = 'en-US';

/** Schema version for serialized translation namespaces */
export const TRANSLATION_SCHEMA_VERSION = '1.0';

/** Plural form keys recognized from Intl.PluralRules */
export const PLURAL_KEYS = new Set<string>(['zero', 'one', 'two', 'few', 'many', 'other']);

/** Built-in English common translations for zero-config usage */
export const BUILT_IN_COMMON_EN: Record<string, string> = {
  'save':     'Save',
  'cancel':   'Cancel',
  'delete':   'Delete',
  'confirm':  'Confirm',
  'close':    'Close',
  'back':     'Back',
  'next':     'Next',
  'submit':   'Submit',
  'edit':     'Edit',
  'loading':  'Loading…',
  'error':    'An error occurred.',
  'success':  'Success',
  'warning':  'Warning',
  'required': 'This field is required.',
  'invalid':  'Invalid value.',
};
