# iDoo ERP Platform — Validation Engine

---

## 1. Overview

The Validation Engine applies form field validation rules defined in `FormFieldDef.validators` and `FormFieldDef.asyncValidators`. It bridges the declarative metadata layer with Angular's `ReactiveFormsModule` validator functions, and maps server-side validation errors (HTTP 400 `fieldErrors`) back onto form controls.

---

## 2. ValidatorDef

```typescript
interface ValidatorDef {
  type: ValidatorType;
  value?: unknown;         // e.g. min/max value, pattern string, maxLength number
  message?: string;        // override default error message
}

type ValidatorType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'email'
  | 'pattern'
  | 'url'
  | 'phone'
  | 'noWhitespace'
  | 'integer'
  | string;               // custom validator type registered in ValidatorRegistry
```

---

## 3. ValidatorRegistry

The `ValidatorRegistry` maps `ValidatorType` strings to Angular `ValidatorFn` factories:

```typescript
@Injectable({ providedIn: 'root' })
class ValidatorRegistry {
  private readonly validators = new Map<string, ValidatorFactory>();
  
  register(type: string, factory: ValidatorFactory): void {
    this.validators.set(type, factory);
  }
  
  resolve(def: ValidatorDef): ValidatorFn {
    const factory = this.validators.get(def.type);
    if (!factory) throw new Error(`Unknown validator type: ${def.type}`);
    return factory(def.value, def.message);
  }
}

type ValidatorFactory = (value?: unknown, message?: string) => ValidatorFn;
```

---

## 4. Built-in Validators

The platform registers these validators at bootstrap:

| Type | Angular Equivalent | Default Error Message |
|---|---|---|
| `required` | `Validators.required` | `This field is required.` |
| `minLength` | `Validators.minLength(n)` | `Must be at least {n} characters.` |
| `maxLength` | `Validators.maxLength(n)` | `Must be at most {n} characters.` |
| `min` | `Validators.min(n)` | `Must be at least {n}.` |
| `max` | `Validators.max(n)` | `Must be at most {n}.` |
| `email` | `Validators.email` | `Must be a valid email address.` |
| `pattern` | `Validators.pattern(p)` | `Invalid format.` |
| `url` | custom | `Must be a valid URL.` |
| `phone` | custom | `Must be a valid phone number.` |
| `noWhitespace` | custom | `Cannot contain only whitespace.` |
| `integer` | custom | `Must be a whole number.` |

---

## 5. Validator Application

`FormBuilderService` calls `ValidatorRegistry.resolve()` for each `ValidatorDef` and applies them to the `FormControl`:

```typescript
const validators = field.validators?.map(v => this.validatorRegistry.resolve(v)) ?? [];
const asyncValidators = field.asyncValidators?.map(v => this.asyncValidatorRegistry.resolve(v)) ?? [];

const control = new FormControl(
  { value: initialValue, disabled: field.disabled === true },
  { validators, asyncValidators, updateOn: 'blur' }
);
```

---

## 6. AsyncValidatorDef

```typescript
interface AsyncValidatorDef {
  type: string;            // e.g. 'uniqueUsername', 'ibanFormat'
  value?: unknown;
  debounceMs?: number;     // default: 400ms
  message?: string;
}
```

Async validators are used for server-side checks that cannot be done locally (e.g., username uniqueness). They must be registered in `AsyncValidatorRegistry`.

**Example: Unique username check**

```typescript
asyncValidatorRegistry.register('uniqueUsername', (_, message) =>
  (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return of(null);
    return timer(400).pipe(
      switchMap(() => userApi.checkUsernameAvailable(control.value)),
      map(available => available ? null : { unique: message ?? 'Username is already taken.' }),
      catchError(() => of(null))   // network errors should not fail validation
    );
  }
);
```

---

## 7. Error Message Display

The `FieldErrorComponent` reads `FormControl.errors` and maps error keys to display messages:

**Priority order:**
1. `control.errors.server` → string from server validation (highest priority)
2. `fieldDef.errorMessages[errorKey]` → custom message from metadata
3. `ValidatorRegistry.defaultMessages[errorKey]` → platform default message
4. Generic fallback: `This field is invalid.`

```
┌─ Email ──────────────────────────────┐
│  john@                               │
└──────────────────────────────────────┘
⚠ Must be a valid email address.
```

---

## 8. Server Validation Error Mapping

When the API returns HTTP 400 with `fieldErrors`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "fieldErrors": {
      "email": "This email is already registered.",
      "username": "Username cannot contain spaces."
    }
  }
}
```

`FormErrorMapperService` applies these to the form:

```typescript
class FormErrorMapperService {
  applyErrors(form: FormGroup, fieldErrors: Record<string, string>): void {
    Object.entries(fieldErrors).forEach(([field, message]) => {
      const control = form.get(field);
      if (control) {
        control.setErrors({ server: message });
        control.markAsTouched();
      }
    });
  }
}
```

Server errors are cleared when the user modifies the control (Angular clears `errors` on value change by default — but server errors must be explicitly cleared on `valueChanges` since `setErrors` overrides Angular's native error set).

---

## 9. Conditional Validation

`required` and other validators can be dynamic predicates:

```typescript
{
  key: 'contractEndDate',
  type: 'date',
  label: 'Contract End Date',
  required: (model) => model['contractType'] === 'FIXED_TERM',
}
```

The `FormBuilderService` re-evaluates all predicate-based validators whenever the form value changes (via `form.valueChanges` subscription), updating `FormControl.setValidators()` dynamically. This ensures validation is always in sync with form state.

---

## 10. Custom Validators (Plugin Extension)

Plugins register custom validators:

```typescript
// In fleet plugin initialization:
validatorRegistry.register('plateNumber', (_, message) =>
  (control: AbstractControl): ValidationErrors | null => {
    const valid = /^[A-Z]{3}\d{4}$/.test(control.value ?? '');
    return valid ? null : { plateNumber: message ?? 'Invalid plate number format (e.g. ABC1234).' };
  }
);
```

Then in any `FormFieldDef`:

```typescript
{
  key: 'licensePlate',
  type: 'text',
  label: 'License Plate',
  validators: [{ type: 'plateNumber' }],
}
```
