# Integration Guide

## Bootstrap Setup

Minimal setup — no module import required (all services are `providedIn: 'root'`):

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // Optional: override initial theme
    { provide: THEME_INITIAL_ID,  useValue: 'platform-dark' },
    // Optional: register remote provider
    { provide: THEME_PROVIDERS, useValue: [new MyHttpThemeProvider()] },
    // Optional: extend cache TTL
    { provide: THEME_CACHE_TTL_MS, useValue: 15 * 60 * 1000 },
  ],
};
```

## In a Component

```typescript
@Component({
  template: `
    <div [attr.data-theme]="engine.activeVariant()">
      <button (click)="toggleDark()">Toggle Dark</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly engine = inject(ThemeEngineService);

  toggleDark() {
    this.engine.isDark() ? this.engine.setLightTheme() : this.engine.setDarkTheme();
  }
}
```

## Reading Tokens in TypeScript

```typescript
const primary = inject(ThemeEngineService).getToken('colors', 'primary');
```

## Reading Tokens in SCSS

```scss
// All theme tokens are available as CSS variables
.card {
  background:    var(--platform-color-surface);
  border:        1px solid var(--platform-color-border);
  border-radius: var(--platform-radius-lg);
  box-shadow:    var(--platform-elevation-md);
  padding:       var(--platform-spacing-4);
}
```

## Integration with Experience Engine

`ThemeEngineService` delegates state to `ExperienceEngineService`:

```typescript
engine.setTheme('acme-brand');
// Internally calls: ExperienceEngineService.setTheme('acme-brand')
// Which updates: ExperienceState.themeId()
// Which causes: ThemeEngine.effectiveTheme() to recompute
// Which triggers: effect() → _applyToDom()
```

## Multi-Tenant Resolution

```typescript
const resolver = inject(ExperienceResolverService);

const ctx = resolver.buildContext()
  .forTenant('acme-corp')
  .platformTheme('platform-light')
  .tenantTheme('acme-blue')     // tenant brand override
  .build();

const resolved = resolver.resolve(ctx);
if (resolved.effectiveThemeId) {
  engine.setTheme(resolved.effectiveThemeId);
}
```

## Reactive Theme Switching in SCSS

The `data-theme` attribute on `<html>` enables CSS-only variant switching:

```scss
:root {
  --platform-color-primary: #1976d2;  // written by ThemeEngine
}

[data-theme="dark"] {
  // These are NOT needed — ThemeEngine overwrites :root variables directly
  // This pattern is for hardcoded fallbacks only
}
```

## Integration with Layout Engine

Layout Engine already reads `--platform-*` CSS variables for elevation maps.
No additional wiring needed — switching themes automatically updates those variables.

## Listening to Theme Events

```typescript
const engine = inject(ThemeEngineService);

engine.events$.pipe(
  filter(e => e.type === 'theme:changed'),
).subscribe(event => {
  const changed = event as ThemeChangedEvent;
  analytics.track('theme_changed', { variant: changed.effective?.variant });
});
```
