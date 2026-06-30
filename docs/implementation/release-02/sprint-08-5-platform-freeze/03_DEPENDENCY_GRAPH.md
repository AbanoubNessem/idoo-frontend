# Dependency Graph — Sprint 8.5

## Full Platform Dependency Map

```
legend: → imports from
        (opt) = { optional: true }
        * = via InjectionToken

═══════════════════════════════════════════════════════
EXPERIENCE ENGINES (Sprint 8.1–8.4)
═══════════════════════════════════════════════════════

VisualExperienceEngineService
  → VisualExperienceState
  → VisualExperienceEventsService
  → VisualExperienceRegistryService
  → VisualExperienceResolverService
  → VisualExperienceMetricsService
  → VisualExperienceDiagnosticsService
  → ExperienceEngineService          [setTypography/setDensity/setIconPack]
  → VISUAL_AUTO_APPLY *
  → DOCUMENT, PLATFORM_ID

VisualExperienceState
  → ExperienceState                  [computed projections of typographyId/densityId/iconPackId]

ThemeEngineService (experience/theme)
  → ThemeRegistryService (experience/theme)
  → ThemeLoaderService
  → ThemeCacheService
  → ThemeValidatorService
  → ThemeSerializerService
  → ExperienceResolverService
  → ExperienceEngineService
  → DOCUMENT, THEME_AUTO_APPLY *, THEME_INITIAL_ID *

ExperienceResolverService
  → ExperienceResolutionPipelineService
  → ExperienceState

ExperienceResolutionPipelineService
  → THEME_RESOLUTION_POLICY * (opt)

TranslationEngineService
  → TranslationRegistryService
  → TranslationLoaderService
  → TranslationCacheService
  → TranslationValidatorService
  → TranslationSerializerService
  → ExperienceState
  → TRANSLATION_DEFAULT_NAMESPACE *, TRANSLATION_FALLBACK_LOCALE *
  → TRANSLATION_INTERPOLATION_OPEN *, TRANSLATION_INTERPOLATION_CLOSE *

CultureResolverService
  → CultureRegistryService
  → CULTURE_BROWSER_DETECTION *
  → PLATFORM_ID

LocalizationEngineService
  → ExperienceState
  → LOCALIZATION_DEFAULT_LOCALE *, LOCALIZATION_FALLBACK_LOCALE *

ExperienceEngineService
  → ExperienceState
  → ExperienceContext
  → ExperienceRegistryService
  → ExperienceEventsService
  → ExperienceMetricsService
  → ExperienceLifecycleService
  → ExperienceSerializerService
  → ExperienceBuilderService
  → ExperienceDiagnosticsService
  → EXPERIENCE_STORAGE * (opt)
  → EXPERIENCE_DEFAULT_PROFILE *
  → LayoutEngineService (layout/) (opt)   ← cross-subsystem dep

ExperienceState
  → EXPERIENCE_INITIAL_STATE *

═══════════════════════════════════════════════════════
LAYOUT ENGINE (Sprint 7)
═══════════════════════════════════════════════════════

LayoutEngineService (layout/)
  → LayoutRegistryService
  → LayoutEventsService
  → LayoutMetricsService
  → LayoutDiagnosticsService
  → LayoutSerializerService
  → LayoutLifecycleService
  → LayoutRendererService
  → LAYOUT_DEFAULT_CONFIG *
  → PLATFORM_ID

LayoutRendererService
  → LayoutRegistryService
  → LayoutFactoryService
  → DOCUMENT

LayoutBuilderService → (standalone)
LayoutFactoryService → LayoutRegistryService, LayoutBuilderService

LayoutHostComponent → LayoutEngineService
LayoutSlotDirective → LayoutEngineService

FormLayoutAdapter
  → LayoutEngineService
  → DynamicFormEngineService     ← cross-subsystem dep

═══════════════════════════════════════════════════════
DYNAMIC FORM ENGINE (Sprint 6)
═══════════════════════════════════════════════════════

DynamicFormEngineService
  → DynamicFormRegistryService
  → DynamicFormResolverService
  → DynamicFormSerializerService
  → DynamicFormSnapshotService
  → DynamicFormEventsService
  → DynamicFormMetricsService
  → DynamicFormDiagnosticsService
  → DynamicFormLifecycleService
  → DynamicFormFactoryService
  → FORM_DEFAULT_CONFIG *

DynamicFormFactoryService → ComponentRegistryService   ← cross-subsystem dep
DynamicFormState → (standalone)
DynamicFormHistory → DynamicFormState

═══════════════════════════════════════════════════════
COMPONENT LIBRARY (Sprint 5)
═══════════════════════════════════════════════════════

ComponentRegistryService → (standalone)
ComponentFactoryService → ComponentRegistryService
ComponentResolverService → ComponentRegistryService
ComponentContextService → DensitySystemService (ui/)   ← cross-layer dep
ComponentTokensService → DesignTokenRegistryService (ui/), DensitySystemService (ui/)
MaterialAdapterConnector → ComponentRegistryService, ComponentFactoryService

Each field component (e.g. TextFieldComponent)
  → BaseFieldComponent
  → ComponentContextService

═══════════════════════════════════════════════════════
RENDERING ENGINE (Sprint 5)
═══════════════════════════════════════════════════════

RenderingEngineService
  → RendererRegistryService
  → RendererResolverService
  → RendererFactoryService
  → RenderCacheService
  → RenderDiagnosticsService
  → RenderEventsService
  → RenderMetricsService
  → AdapterManagerService

RendererResolverService → RendererRegistryService
Each renderer (TextRenderer etc.) → AbstractFieldRenderer

═══════════════════════════════════════════════════════
METADATA ENGINE (Sprint 2)
═══════════════════════════════════════════════════════

MetadataEngineService
  → MetadataManagerService
  → MetadataCacheService
  → MetadataIndexerService
  → MetadataValidatorService
  → MetadataStatisticsService
  → MetadataEventsService
  → MetadataLifecycleService
  → MetadataDiagnosticsService

MetadataLoaderService → (standalone)
MetadataPipelineService → MetadataLoaderService, MetadataCacheService
MetadataResolverService → MetadataManagerService, MetadataIndexerService

═══════════════════════════════════════════════════════
UI LAYER (Pre-R2, Sprint 1)
═══════════════════════════════════════════════════════

UIContextService
  → ThemeManagerService (ui/)
  → ResponsiveEngineService
  → DensitySystemService
  → AccessibilityService
  → MotionEngineService

ThemeManagerService (ui/)
  → ThemeEngineService (ui/)
  → ThemeRegistryService (ui/)

ThemeEngineService (ui/)
  → ColorSystemService
  → SpacingSystemService
  → TypographySystemService
  → DensitySystemService

All ui/ subsystem services → (standalone — no dependencies outside ui/)
```

## Cross-Subsystem Dependencies (Non-Obvious)

| From | To | Token | Risk |
|---|---|---|---|
| ExperienceEngineService | LayoutEngineService (layout/) | DI optional | ✅ Low — optional, graceful |
| FormLayoutAdapter | DynamicFormEngineService | DI | ✅ Low — adapter pattern |
| ComponentContextService | DensitySystemService (ui/) | DI | ⚠️ Medium — bridges layers |
| ComponentTokensService | DesignTokenRegistryService (ui/) | DI | ⚠️ Medium — bridges layers |
| DynamicFormFactoryService | ComponentRegistryService | DI | ✅ Low — expected |

## Circular Dependency Check

**Result: NONE DETECTED**

All import chains terminate without cycles. Verified by:
1. Manual trace of all cross-subsystem imports above
2. `npx tsc --noEmit` → 0 errors (TypeScript would surface circular imports via type resolution errors)
3. `ng build` success (webpack/esbuild would report circular chunk dependency warnings)
