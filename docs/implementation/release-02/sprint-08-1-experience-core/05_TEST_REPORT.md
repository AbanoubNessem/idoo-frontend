# Sprint 8.1 — Test Report

**Test files:** 8  
**Location:** `src/app/core/platform/experience/tests/`

| File | Units Tested | Coverage Focus |
|---|---|---|
| `experience-state.spec.ts` | `ExperienceState` | Default values, setters, direction derivation, RTL language codes, applySnapshot, reset, initial state token |
| `experience-registry.service.spec.ts` | `ExperienceRegistryService` | Register/get/has/unregister, multi-dimension isolation, countByDimension, defaultFor, byTag, clear |
| `experience-events.service.spec.ts` | `ExperienceEventsService` | Emit, on() filter, onAny() filter, previous payload, timestamp format |
| `experience-builder.service.spec.ts` | `ExperienceBuilderService` | All setters, rtlArabic helper, default helper, idempotent build |
| `experience-serializer.service.spec.ts` | `ExperienceSerializerService` | Serialize, deserialize, schema version, invalid JSON, wrong schema, clone |
| `experience-metrics.service.spec.ts` | `ExperienceMetricsService` | recordApply (count/avg), recordChange per dimension, recordError, reset, disabled mode |
| `experience-context.spec.ts` | `ExperienceContext` | All signal accessors, isRtl, isLanguage, isLocale, snapshot consistency |
| `experience-engine.service.spec.ts` | `ExperienceEngineService` | Phase lifecycle, register/has/get/all, all setters, apply, reset, serialize, exportCurrentState, event emission, default profile token |
| `experience-integration.spec.ts` | End-to-end | Full lifecycle, RTL context sync, multi-event firing, diagnostics, sequential applies, builder integration |

## RTL Test Coverage

`ExperienceState` tests verify all 9 built-in RTL language codes produce `direction: 'rtl'`. Additional coverage in integration tests for Arabic (ar) specifically.

## Disabled Metrics

`ExperienceMetricsService` has separate describe blocks for enabled/disabled modes to verify the opt-in guard works correctly.

## Token Override Tests

`ExperienceState` and `ExperienceEngineService` tests include scenarios with `EXPERIENCE_INITIAL_STATE` and `EXPERIENCE_DEFAULT_PROFILE` token overrides to verify DI-driven initialization.
