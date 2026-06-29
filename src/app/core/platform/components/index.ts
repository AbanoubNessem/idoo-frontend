// ─── Types ───────────────────────────────────────────────────────────────────
export * from './component.types';

// ─── Contracts ───────────────────────────────────────────────────────────────
export * from './contracts/platform-component';
export * from './contracts/platform-field-component';
export * from './contracts/platform-layout-component';
export * from './contracts/platform-widget-component';

// ─── Registry ────────────────────────────────────────────────────────────────
export { ComponentRegistryService } from './registry/component-registry.service';
export { ComponentFactoryService, type ComponentInstance } from './registry/component-factory.service';

// ─── Resolver ────────────────────────────────────────────────────────────────
export { ComponentResolverService, type ResolverState } from './resolver/component-resolver.service';

// ─── Context ─────────────────────────────────────────────────────────────────
export { ComponentContextService } from './context/component-context.service';

// ─── Diagnostics ─────────────────────────────────────────────────────────────
export { ComponentDiagnosticsService } from './diagnostics/component-diagnostics.service';

// ─── Metrics ─────────────────────────────────────────────────────────────────
export { ComponentMetricsService } from './metrics/component-metrics.service';

// ─── Lifecycle ───────────────────────────────────────────────────────────────
export { ComponentLifecycleService } from './lifecycle/component-lifecycle.service';

// ─── Tokens ──────────────────────────────────────────────────────────────────
export { ComponentTokensService } from './tokens/component-tokens.service';

// ─── Base ────────────────────────────────────────────────────────────────────
export { BaseFieldComponent } from './base/base-field.component';

// ─── Field Components ────────────────────────────────────────────────────────
export { PlatformTextFieldComponent }         from './fields/text-field/platform-text-field.component';
export { PlatformNumberFieldComponent }       from './fields/number-field/platform-number-field.component';
export { PlatformCurrencyFieldComponent }     from './fields/currency-field/platform-currency-field.component';
export { PlatformDateFieldComponent }         from './fields/date-field/platform-date-field.component';
export { PlatformTimeFieldComponent }         from './fields/time-field/platform-time-field.component';
export { PlatformCheckboxFieldComponent }     from './fields/checkbox-field/platform-checkbox-field.component';
export { PlatformSwitchFieldComponent }       from './fields/switch-field/platform-switch-field.component';
export { PlatformTextareaFieldComponent }     from './fields/textarea-field/platform-textarea-field.component';
export { PlatformSelectFieldComponent }       from './fields/select-field/platform-select-field.component';
export { PlatformLookupFieldComponent }       from './fields/lookup-field/platform-lookup-field.component';
export { PlatformAutocompleteFieldComponent } from './fields/autocomplete-field/platform-autocomplete-field.component';
export { PlatformFileFieldComponent }         from './fields/file-field/platform-file-field.component';
export { PlatformImageFieldComponent }        from './fields/image-field/platform-image-field.component';
export { PlatformAvatarFieldComponent }       from './fields/avatar-field/platform-avatar-field.component';
export { PlatformChipFieldComponent }         from './fields/chip-field/platform-chip-field.component';
export { PlatformBadgeFieldComponent }        from './fields/badge-field/platform-badge-field.component';
export { PlatformColorFieldComponent }        from './fields/color-field/platform-color-field.component';
export { PlatformJsonFieldComponent }         from './fields/json-field/platform-json-field.component';
export { PlatformMarkdownFieldComponent }     from './fields/markdown-field/platform-markdown-field.component';

// ─── Playground ──────────────────────────────────────────────────────────────
export { PlatformPlaygroundComponent } from './playground/platform-playground.component';

// ─── Adapter Connection ──────────────────────────────────────────────────────
export { MaterialAdapterConnector } from './adapter/material-adapter.connector';
