# Sprint 8.1 — Risk Report

| ID | Risk | Severity | Probability | Mitigation |
|---|---|---|---|---|
| R1 | Profile stub interfaces too narrow for future engines | Medium | Low | Future engines extend the stubs; the registry uses generics (`DimensionProfileMap`) to preserve type safety when extending |
| R2 | `RTL_LANGUAGE_CODES` set incomplete | Low | Low | The set covers all ISO 639-1 RTL languages. Future languages can be added by extending the set; it does not require changing the state logic |
| R3 | `EXPERIENCE_STORAGE` not provided causes silent no-op | Low | Medium | The token is optional. Engine calls `this._storage?.save()`. No-op is the correct fallback when no persistence is desired. Add docs/comments warning that state won't survive reload without it |
| R4 | `LayoutEngineService` injection creates a hard cross-module dep if misused | Medium | Low | Injected as `{ optional: true }`. Tests run without it. Future-proofed via event bus (alternative: consume `direction:changed` event in LayoutEngine instead) |
| R5 | ExperienceEngine initializes in constructor (eager) | Low | Low | All injected services are `providedIn: 'root'` singletons. Constructor init is correct for a root service. `ngOnDestroy` is a no-op but included for completeness |
| R6 | `direction` is derived from `languageCode` only | Low | Low | Some locales (e.g. Uyghur in China) use RTL but may be coded as 'ug' (not in default set). Future engines can update the constants; the architecture supports it |

## No Critical Risks

The Experience Core is infrastructure-only. No business logic, no API calls, no side effects beyond `document.documentElement.setAttribute('dir', ...)`. The failure surface is very small.
