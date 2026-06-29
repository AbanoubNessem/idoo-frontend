# Sprint 5 — Component Contracts

---

## Contract Hierarchy

```
PlatformComponent          ← base contract for all components
├── PlatformFieldComponent  ← all 19 field components
├── PlatformLayoutComponent ← grid/flex containers (Sprint 6+)
└── PlatformWidgetComponent ← KPI cards, charts (Sprint 6+)
```

---

## PlatformComponent (base)

Every component in the library satisfies this interface.

```typescript
interface PlatformComponent {
  readonly componentKey: string;        // 'platform-text-field'
  readonly componentVersion: string;    // '5.0'
  readonly componentCategory: ComponentCategory; // 'field' | 'layout' | 'widget'
  readonly loading: Signal<boolean> | boolean;
  readonly skeleton: Signal<boolean> | boolean;
  readonly ariaLabel: Signal<string> | string;
  readonly meta: PlatformComponentMeta;
}
```

---

## PlatformFieldComponent<T>

All 19 field components implement this interface. `T` is the value type (e.g., `string`, `number`, `boolean`, `SelectOption`).

```typescript
interface PlatformFieldComponent<T = unknown> extends PlatformComponent {
  // Identity
  readonly fieldKey: Signal<string>;
  readonly fieldType: ComponentFieldType;

  // Labels & UX
  readonly label: Signal<string>;
  readonly placeholder: Signal<string>;
  readonly hint: Signal<string>;
  readonly prefixIcon: Signal<string>;
  readonly suffixIcon: Signal<string>;

  // State
  readonly disabled: Signal<boolean>;
  readonly readonly: Signal<boolean>;
  readonly required: Signal<boolean>;

  // Value (two-way binding)
  readonly value: Signal<T | null>;
  readonly valueChange: EventEmitter<T | null>;

  // Validation
  readonly errors: Signal<string[]>;
  readonly validators: Signal<ValidatorSpec[]>;
  readonly validationResult: Signal<ValidationResult>;
  validate(): ValidationResult;

  // Permissions
  readonly permissions: Signal<string[]>;

  // Expression Engine hooks
  readonly hiddenExpression: Signal<string>;
  readonly disabledExpression: Signal<string>;
  readonly valueExpression: Signal<string>;

  // Events
  readonly blur: EventEmitter<void>;
  readonly focus: EventEmitter<void>;
  readonly validationChange: EventEmitter<ValidationResult>;
}
```

### Why expressions on the field contract?

Expression evaluation (Sprint 6 Dynamic Form Engine) reads these expressions from field metadata and evaluates them against the form model. The fields don't evaluate expressions themselves — they only store the expression strings as configuration. This makes the contract forward-compatible without requiring re-implementation.

---

## PlatformLayoutComponent

```typescript
interface PlatformLayoutComponent extends PlatformComponent {
  readonly componentCategory: 'layout';
  readonly display: Signal<'flex' | 'grid' | 'block'>;
  readonly gap: Signal<string>;
  readonly slots: Signal<LayoutSlot[]>;
  readonly columns: Signal<number | string>;
  readonly direction: Signal<LayoutDirection>;
  readonly align: Signal<LayoutAlign>;
  readonly justify: Signal<LayoutJustify>;
  readonly wrap: Signal<LayoutWrap>;
  readonly padding: Signal<string>;
}
```

Not implemented in Sprint 5 — contracts are defined here so Sprint 6 Dynamic Forms can implement them with full backward compatibility.

---

## PlatformWidgetComponent

```typescript
interface PlatformWidgetComponent extends PlatformComponent {
  readonly componentCategory: 'widget';
  readonly data: Signal<unknown>;
  readonly title: Signal<string>;
  readonly subtitle: Signal<string>;
  readonly size: Signal<WidgetSize>;
  readonly variant: Signal<WidgetVariant>;
  readonly dataLoaded: Signal<boolean>;
  readonly dataError: Signal<string | null>;
  readonly action: EventEmitter<unknown>;
  refresh(): void;
}
```

Not implemented in Sprint 5. Defined for Sprint 6+ widget development.

---

## DensityAware

Optional mixin contract for components that respond to density changes:

```typescript
interface DensityAware {
  readonly density: Signal<ComponentDensity> | ComponentDensity;
}
```

`BaseFieldComponent` provides `effectiveDensity = computed(() => ctx.currentDensity())` which maps the `DensitySystemService` level to `ComponentDensity`.

---

## ValidatableComponent

Optional mixin contract for synchronous field validation:

```typescript
interface ValidatableComponent {
  validate(): ValidationResult;
  readonly validationResult: Signal<ValidationResult>;
}
```

All 19 field components implement this via `BaseFieldComponent`.

---

## Why Interfaces, Not Abstract Classes?

Interfaces allow multiple inheritance in TypeScript — a `PlatformFieldComponent` can simultaneously satisfy `DensityAware` and `ValidatableComponent` without class hierarchy conflicts. The implementation is provided by `BaseFieldComponent` (abstract class), which is a separate concern from the contract specification.
