// ─── Translation Data Model ───────────────────────────────────────────────────

/** A leaf value (string) or nested object of values. */
export type TranslationLeaf   = string;
export type TranslationNode   = { readonly [key: string]: TranslationValue };
export type TranslationValue  = TranslationLeaf | TranslationNode;
export type TranslationMap    = Record<string, TranslationValue>;

/** A plural map: keys are Intl.PluralRules categories. */
export interface PluralTranslation {
  readonly zero?:  string;
  readonly one?:   string;
  readonly two?:   string;
  readonly few?:   string;
  readonly many?:  string;
  readonly other:  string;   // required
}

// ─── Namespace ────────────────────────────────────────────────────────────────

export interface TranslationNamespace {
  readonly namespace: string;
  readonly locale:    string;
  readonly data:      TranslationMap;
  readonly version?:  string;
  readonly loadedAt?: string;
}

// ─── Load Options ─────────────────────────────────────────────────────────────

export interface TranslationLoadOptions {
  readonly force?:   boolean;
  readonly timeout?: number;
}

export interface TranslationLoadResult {
  readonly namespace: string;
  readonly locale:    string;
  readonly loaded:    boolean;
  readonly source:    string;
  readonly duration:  number;
  readonly error?:    string;
}

// ─── Translate Options ────────────────────────────────────────────────────────

export interface TranslationOptions {
  /** Explicit namespace. Overrides the ':' prefix in the key. */
  readonly namespace?: string;
  /** If provided, picks the plural form from a plural translation object. */
  readonly count?:     number;
  /** Template parameters for interpolation: `{{key}}` → params.key */
  readonly params?:    Readonly<Record<string, string | number | boolean>>;
  /** Returned when the key is missing. Defaults to the key itself. */
  readonly fallback?:  string;
  /** Override the active locale for this call only. */
  readonly locale?:    string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface TranslationValidationResult {
  readonly valid:     boolean;
  readonly errors:    ReadonlyArray<string>;
  readonly warnings:  ReadonlyArray<string>;
  readonly keyCount:  number;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface TranslationsLoadedEvent {
  readonly type:      'translations:loaded';
  readonly namespace: string;
  readonly locale:    string;
  readonly keyCount:  number;
}

export interface TranslationsInvalidatedEvent {
  readonly type:      'translations:invalidated';
  readonly namespace: string;
  readonly locale?:   string;
}

export type TranslationEvent =
  | TranslationsLoadedEvent
  | TranslationsInvalidatedEvent;
