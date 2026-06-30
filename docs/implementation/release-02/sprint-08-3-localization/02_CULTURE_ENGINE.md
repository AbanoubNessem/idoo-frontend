# Culture Engine

## Purpose

The Culture Engine is the authoritative source for all culture-related metadata: language,
locale, region, timezone, calendar system, week start day, number system, and measurement system.

## CultureDefinition

```typescript
interface CultureDefinition {
  code:              string;        // BCP 47: 'en-US', 'ar-SA'
  language:          string;        // ISO 639-1: 'en', 'ar'
  region?:           string;        // ISO 3166-1: 'US', 'SA'
  name:              string;        // 'English (United States)'
  nativeName:        string;        // Native display name
  direction:         'ltr' | 'rtl';
  timezone:          string;        // IANA: 'America/New_York'
  calendar:          CalendarSystem; // 'gregory' | 'islamic' | 'hebrew' | ...
  weekStart:         DayOfWeek;     // 0=Sunday, 1=Monday
  numberSystem:      NumberSystem;  // 'latn' | 'arab' | 'arabext' | ...
  measurementSystem: MeasurementSystem; // 'metric' | 'imperial' | 'us'
  currency?:         string;        // ISO 4217: 'USD', 'EUR'
  tags?:             ReadonlyArray<string>;
}
```

## Built-in Cultures

| Code | Language | Direction | Currency | Notes |
|---|---|---|---|---|
| `en-US` | English | ltr | USD | Default |
| `en-GB` | English | ltr | GBP | Week starts Monday |
| `ar-SA` | Arabic | rtl | SAR | Islamic calendar |
| `ar-EG` | Arabic | rtl | EGP | Gregorian calendar |
| `de-DE` | German  | ltr | EUR | |
| `fr-FR` | French  | ltr | EUR | |
| `zh-CN` | Chinese | ltr | CNY | |

## CultureRegistryService

```typescript
const registry = inject(CultureRegistryService);

registry.get('en-US')                // CultureDefinition
registry.byLanguage('ar')            // all Arabic cultures
registry.byRegion('US')              // all US cultures
registry.rtlCultures()              // all RTL cultures
registry.byTag('built-in')          // all built-in cultures
registry.defaultCulture()           // returns en-US by default
registry.register(myCulture, { isDefault: true })
```

## CultureResolverService

Applies the 6-layer resolution order to produce an `EffectiveCulture`:

```
Platform Default
  ↓
Tenant
  ↓
Company
  ↓
User
  ↓
Browser (auto-detected from navigator.language)
  ↓
Runtime Override
  ↓
EffectiveCulture
```

```typescript
const resolver = inject(CultureResolverService);

const input: CultureResolutionInput = {
  codeByLayer: {
    platform: 'en-US',
    tenant:   'ar-SA',
    user:     'de-DE',
  },
};

const result    = resolver.resolve(input);          // CultureResolutionResult
const effective = resolver.resolveEffective(input); // EffectiveCulture
const browser   = resolver.detectBrowser();         // BrowserCultureInfo | null
```

## CultureProvider Interface

External code can provide custom cultures:

```typescript
const CULTURE_PROVIDERS = new InjectionToken<CultureProvider[]>('CULTURE_PROVIDERS');

interface CultureProvider {
  id:   string;
  name: string;
  canProvide(code: string): boolean;
  get(code: string): Promise<CultureDefinition>;
  list?(): Promise<ReadonlyArray<{ code: string; name: string }>>;
}
```

## Browser Auto-Detection

Set `CULTURE_BROWSER_DETECTION` to `true` (default) to resolve the browser locale automatically.
The resolver reads `navigator.language` / `navigator.languages` and matches against registered cultures.
Safe for SSR — uses `isPlatformBrowser(platformId)` before accessing `navigator`.

```typescript
// Disable browser detection
{ provide: CULTURE_BROWSER_DETECTION, useValue: false }
```
