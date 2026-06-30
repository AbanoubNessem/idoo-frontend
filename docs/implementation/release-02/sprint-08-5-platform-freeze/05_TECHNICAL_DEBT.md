# Technical Debt Register — Sprint 8.5

All known technical debt items are documented here. Items are classified by severity and estimated effort.

---

## DEBT-001: Dual-Layer Architecture (`ui/` vs `experience/`)

**Severity:** Medium  
**Effort:** High (deferred to post-Dynamic-Table sprint)  
**Introduced:** Sprint 1 (`ui/`), Sprint 8.1–8.4 (`experience/`)

### Description

Two parallel technology layers exist in the platform for themes, typography, density, motion, icons, and accessibility:

| Concern | `platform/ui/` (Layer 1) | `platform/experience/` (Layer 2) |
|---|---|---|
| Themes | `ThemeEngineService`, `ThemeRegistryService`, `ThemeManagerService` | `ThemeEngineService` (experience) |
| Typography | `TypographySystemService` | `VisualExperienceEngineService` |
| Density | `DensitySystemService` | `VisualExperienceEngineService` |
| Motion | `MotionEngineService`, `AnimationRegistryService` | `VisualExperienceEngineService` |
| Icons | `IconRegistryService` | `VisualExperienceEngineService` |
| Color tokens | `ColorSystemService` | `ThemeEngineService` (experience) |
| Spacing tokens | `SpacingSystemService` | `ThemeEngineService` (experience) |

Layer 1 (`ui/`) was built before Release 2. Layer 2 (`experience/`) supersedes it with signal-based reactivity and CSS-var application.

**Current State:** Both layers are self-contained. Layer 1 is only depended on by `components/context/component-context.service.ts` and `components/tokens/component-tokens.service.ts` (for `DensitySystemService` and `DesignTokenRegistryService`).

**Remediation Plan (Future Sprint):**
1. Migrate `ComponentContextService` to use `VisualExperienceEngineService.density` signal.
2. Migrate `ComponentTokensService` to use the experience theme CSS vars directly.
3. Deprecate and remove `ui/tokens/density-system.service.ts`, `ui/tokens/design-token-registry.service.ts`.
4. Assess whether overlay, accessibility, and motion services in `ui/` should be migrated or remain.

**Safe to defer:** The `ui/` layer and `experience/` layer have separate DI scopes and do not conflict at runtime.

---

## DEBT-002: Class Name Collisions

**Severity:** Low  
**Effort:** Low (can be resolved via rename at any time)  
**Introduced:** Sprint 7/8.2 (same class names as Sprint 1)

### Classes with duplicate names

| Name | `ui/` location | `experience/` location |
|---|---|---|
| `LayoutEngineService` | `ui/layout/layout-engine.service.ts` | `layout/layout-engine.service.ts` |
| `ThemeEngineService` | `ui/theme/theme-engine.service.ts` | `experience/theme/theme-engine.service.ts` |
| `ThemeRegistryService` | `ui/theme/theme-registry.service.ts` | `experience/theme/theme-registry.service.ts` |

**Current Impact:** None — they resolve to distinct DI singletons via different class references. A developer importing from the wrong barrel could be confused.

**Remediation Plan:**
- Rename `ui/layout/layout-engine.service.ts` class to `UiLayoutEngineService` when DEBT-001 is resolved.
- Rename `ui/theme/*.ts` classes to `UiThemeEngineService`, `UiThemeRegistryService` when DEBT-001 is resolved.
- No immediate action required.

---

## DEBT-003: Large Service Files

**Severity:** Low  
**Effort:** Medium  
**Introduced:** Sprint 6

### Files exceeding 400 lines

| File | Lines | Reason | Action |
|---|---|---|---|
| `dynamic-form-factory.service.ts` | 518 | One `create*()` method per field type | Acceptable factory pattern. Extract to `field-factory/` if >700 lines. |
| `dynamic-form.component.ts` | 505 | Form renders section/tabs/accordion/wizard | Consider splitting presenter/container if complexity grows. |
| `form.types.ts` | 499 | All form type definitions | Types file — no action needed. |

No service currently violates the 500-line guideline, but these are closest to the threshold.

---

## DEBT-004: Features Layer Not Integrated

**Severity:** Low (expected)  
**Effort:** Medium (future sprint work)  
**Introduced:** Sprint 1–8.4 (platform only)

### Description

The `features/` layer (dashboard, auth, branches, companies, demo) does not import from any platform engine. The platform is complete and stable, but is not yet wired into the application shell.

**Expected resolution:** Sprint 9 (Dynamic Table Engine) will begin consuming platform APIs directly through table column definitions, cell renderers, and experience tokens.

---

## DEBT-005: Missing ExperienceState -> ui/ Migration in Components

**Severity:** Low  
**Effort:** Medium  

`ComponentContextService` reads density via `DensitySystemService` (ui/ layer), not via `VisualExperienceEngineService.density` signal. This means density changes via the Sprint 8.4 engine will NOT automatically update component context.

**Impact:** Currently low — density changes require app restart or manual context refresh.

**Remediation:** After DEBT-001 is resolved, replace `DensitySystemService` injection with `inject(VisualExperienceEngineService)` and read `density.level`.

---

## Debt Summary Table

| ID | Description | Severity | Sprint to Resolve |
|---|---|---|---|
| DEBT-001 | Dual-layer (ui/ vs experience/) | Medium | Post-Dynamic-Table |
| DEBT-002 | Class name collisions | Low | Alongside DEBT-001 |
| DEBT-003 | Large service files (3 files ~500 lines) | Low | Monitor |
| DEBT-004 | Features not integrated | Low | Sprint 9+ |
| DEBT-005 | ComponentContext uses ui/density not signals | Low | Alongside DEBT-001 |

**Total critical debt items: 0**  
**Total medium debt items: 1 (DEBT-001)**  
**Total low debt items: 4**
