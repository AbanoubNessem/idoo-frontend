# Sprint 5 — Architecture Decisions

---

## ADR-001: BaseFieldComponent as @Directive, Not @Component

**Decision:** `BaseFieldComponent<T>` is decorated with `@Directive()` not `@Component()`.

**Context:** Abstract base classes in Angular cannot have a `@Component` decorator with a template — subclasses need their own template. Using `@Directive()` satisfies Angular's requirement for a decorator on the class while conveying the correct semantics (it's not a renderable component, it's a host for shared logic).

**Consequences:**
- Concrete components extend `BaseFieldComponent<T>` and add their own `@Component` decorator
- The `@Directive()` decorator means `BaseFieldComponent` cannot be used standalone in a template
- Angular's change detection correctly links the directive's signals to the component's host element

---

## ADR-002: `model()` Signal for Two-Way Binding

**Decision:** Field values use `model<T | null>()` from `@angular/core`, not `@Input()` + `@Output() valueChange`.

**Context:** Angular 17+ introduces `model()` as the idiomatic signal-based two-way binding primitive. It reduces boilerplate (one declaration instead of two), is fully compatible with `[(ngModel)]`-style template binding, and produces `WritableSignal<T>` for internal use.

**Consequences:**
- `[(value)]` template syntax works for two-way binding
- Internal reads use `this.value()` (no need for separate internal state)
- Sprint 6 Dynamic Forms can bind field values to model signals directly
- No RxJS `BehaviorSubject` or `Subject` required for value management

---

## ADR-003: Angular Material Used Internally, Never Exposed

**Decision:** Platform components import Angular Material in their `imports[]` array. Business modules may not import Angular Material.

**Context:** The architectural rule is: "Business modules must never use Angular Material components directly." This means the abstraction happens at the component level, not by avoiding Material entirely.

**Consequences:**
- Angular Material is a transitive dependency — it appears in `package.json` but is never imported in business module TypeScript
- If Material is replaced in the future (e.g., with a custom design system), only `src/app/core/platform/components/` needs to change
- Business components compiled against platform contracts continue to work unchanged

---

## ADR-004: CSS Custom Properties for Component Styling

**Decision:** Component styles reference `var(--platform-color-*)`, `var(--platform-border-radius-*)`, etc. from the Sprint 4 token system.

**Context:** Platform tokens are written to `document.documentElement.style` by `ThemeEngineService`. Component styles that reference these variables automatically reflect the active theme without any Angular change detection.

**Consequences:**
- Zero component re-renders on theme switch
- Dark mode, brand theme, and custom themes are automatically applied to all components
- Component styles can be overridden by business modules via CSS specificity

---

## ADR-005: Skeleton State as Input, Not Internal

**Decision:** `skeleton=true` is an external input, not an internal state managed by the component.

**Context:** The component cannot know whether its data has been loaded — that depends on the caller's data source. The caller (Dynamic Form Engine, business module) sets `skeleton=true` while fetching, then `skeleton=false` once data is available.

**Consequences:**
- Components are purely presentational with respect to data loading state
- The Dynamic Form Engine in Sprint 6 can drive skeleton from its own async lifecycle
- Simpler component internals — no internal loading timers or subscriptions

---

## ADR-006: No ControlValueAccessor in Sprint 5

**Decision:** Platform field components do NOT implement `ControlValueAccessor` in Sprint 5.

**Context:** Implementing CVA for 19 components adds significant boilerplate. The Dynamic Forms engine in Sprint 6 will drive values via the `model()` signal directly. CVA is only needed if `ngModel` or `ReactiveFormsModule` directives are used in templates, which the platform components are specifically designed to avoid.

**Consequences:**
- Cannot use `<platform-text-field [(ngModel)]>` in business templates
- Business modules always bind via `[(value)]` (the `model()` signal binding)
- Sprint 7 can add CVA as an optional adapter if legacy form code requires it

---

## ADR-007: Lookup Field Is Headless for Data Fetching

**Decision:** `PlatformLookupFieldComponent` does not inject any HTTP service for searching. The parent must call `setResults(results)` to supply search results.

**Context:** The platform component library must not know about business-domain entities, API endpoints, or authentication. Coupling a lookup field to a specific HTTP client would violate the abstraction boundary.

**Consequences:**
- Sprint 6 Dynamic Forms will wire lookup fields to entity-type-specific search services via a `LookupDataProvider` token
- The component UI (debounce timer, search spinner, autocomplete panel) is fully implemented; only the data source is external
- Easy to mock in unit tests — just call `setResults(mockResults)` directly

---

## ADR-008: Markdown Preview Is Regex-Based

**Decision:** `PlatformMarkdownFieldComponent.previewHtml()` uses a hand-written regex renderer for Markdown preview.

**Context:** A production-grade CommonMark renderer (e.g., `marked`, `markdown-it`) adds ~70KB to the bundle and requires sanitization (DOMPurify or Angular's `DomSanitizer`). Sprint 5 scope is the component library, not rich text editing.

**Consequences:**
- Basic Markdown subset (headings, bold, italic, code, lists, links) renders correctly
- Complex Markdown (tables, footnotes, task lists) is not rendered
- Sprint 7 can replace `_basicMarkdownToHtml()` with a proper library
- The `innerHTML` binding uses a raw conversion — XSS risk is mitigated by HTML-encoding input (`&`, `<`, `>`) before applying Markdown patterns
