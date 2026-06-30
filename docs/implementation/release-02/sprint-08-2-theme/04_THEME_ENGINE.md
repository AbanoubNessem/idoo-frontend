# ThemeEngine Service

`ThemeEngineService` is the primary public API for all theme operations.

## Signals

```typescript
activeThemeId: Signal<string | null>   // from ExperienceState.themeId
effectiveTheme: Signal<EffectiveTheme> // computed() — recomputes on any change
activeVariant:  Signal<ThemeKind>      // computed from effectiveTheme
isDark:         Signal<boolean>        // computed: variant === 'dark'
isHighContrast: Signal<boolean>        // computed: variant === 'high-contrast'
```

## Switching Themes

```typescript
engine.setTheme('my-brand');        // any registered ID
engine.setLightTheme();             // platform-light
engine.setDarkTheme();              // platform-dark
engine.setHighContrastTheme();      // platform-high-contrast
engine.resetToDefault();            // null → platform-light
```

## Auto-Apply

When `THEME_AUTO_APPLY` is true (default), an Angular `effect()` watches `effectiveTheme`
and automatically writes all CSS variables to `document.documentElement`.

Disable in tests:
```typescript
{ provide: THEME_AUTO_APPLY, useValue: false }
```

## Manual Apply

```typescript
engine.applyThemeNow('platform-dark');  // immediate, bypasses signal
```

## CSS Variable Output

```
--platform-color-primary:       #1976d2
--platform-color-background:    #f5f5f5
--platform-spacing-4:           16px
--platform-radius-md:           4px
--platform-elevation-md:        0 4px 8px rgba(0,0,0,0.12)
--platform-breakpoint-md:       768px
data-theme="light"              (attribute on <html>)
data-theme-id="platform-light"  (attribute on <html>)
```

## Resolution with Context

For multi-tenant scenarios pass a full resolution context:

```typescript
const ctx = engine.buildContext()   // shortcut to ExperienceResolverService.buildContext()
  .forTenant('acme')
  .platformTheme('platform-light')
  .tenantTheme('acme-blue')
  .userTheme('platform-dark')
  .build();

const effective = engine.resolveWithContext(ctx);
```

## Plugin Registration

```typescript
engine.register({
  id: 'my-plugin-theme',
  name: 'My Plugin Theme',
  kind: 'theme',
  variant: 'custom',
  tokens: { colors: { primary: '#e91e63', ... } },
  provider: 'my-marketplace-plugin',
});
```

## Async Loading

```typescript
const theme = await engine.loadTheme('remote-theme-id');
// provider must be registered via ThemeLoaderService.registerProvider()
```

## Serialization

```typescript
const json  = engine.serializeTheme(myTheme);
const back  = engine.deserializeTheme(json);
const full  = engine.exportEffective();  // exports the currently applied theme
```

## Token Access

```typescript
const primary = engine.getToken('colors', 'primary');   // '#1976d2'
const spacing = engine.getToken('spacing', '4');         // '16px'
```

## Events

```typescript
engine.events$.subscribe(event => {
  switch (event.type) {
    case 'theme:changed':   console.log('changed to', event.effective?.variant); break;
    case 'theme:registered': break;
    case 'theme:loaded':    break;
    case 'theme:resolved':  break;
  }
});
```
