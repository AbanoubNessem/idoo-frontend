# Theme Plugin Providers

The `ThemeProvider` interface allows external code (marketplace plugins, tenant integrations)
to supply theme definitions without being compiled into the platform bundle.

## Interface

```typescript
interface ThemeProvider {
  readonly id:   string;    // Unique plugin identifier
  readonly name: string;    // Human-readable plugin name
  canLoad(themeId: string): boolean;
  load(themeId: string, options?: ThemeLoadOptions): Promise<ThemeDefinition>;
  list?(): Promise<ReadonlyArray<{ id: string; name: string }>>;  // optional
}
```

## Registration

### Via Injection Token (compile-time)

```typescript
// In your app module / providers array
{
  provide: THEME_PROVIDERS,
  useValue: [new MyMarketplaceProvider()],
}
```

### Via Runtime API (post-bootstrap)

```typescript
const loader = inject(ThemeLoaderService);
loader.registerProvider(new TenantThemeProvider(tenantConfig));
```

## Example Provider

```typescript
class HttpThemeProvider implements ThemeProvider {
  readonly id   = 'http-themes';
  readonly name = 'HTTP Remote Themes';

  canLoad(themeId: string): boolean {
    return themeId.startsWith('remote-');
  }

  async load(themeId: string): Promise<ThemeDefinition> {
    const resp = await fetch(`/api/themes/${themeId}`);
    if (!resp.ok) throw new Error(`Theme ${themeId} not found.`);
    const data = await resp.json();
    return data as ThemeDefinition;
  }

  async list() {
    const resp = await fetch('/api/themes');
    return resp.json();
  }
}
```

## Loading Flow

```
ThemeEngine.loadTheme(id)
  → ThemeLoaderService.load(id)
      → check ThemeCacheService (TTL = 5 min)
      → find provider: providers.find(p => p.canLoad(id))
      → provider.load(id) with 10s timeout
      → ThemeCacheService.set(result)
      → emit theme:loaded event
```

## Provider Priority

Providers are checked in registration order. The first provider whose `canLoad(id)` returns
true is used. Injection-time providers come before runtime-registered providers.

## Unregistering

```typescript
loader.unregisterProvider('http-themes');
```

## Listing Available Themes

```typescript
const available = await loader.listAvailable();
// returns: [{ id, name, provider }] from all providers that implement .list()
```

## Cache Integration

Loaded themes are cached with a configurable TTL (default 5 minutes):

```typescript
// Increase cache TTL
{ provide: THEME_CACHE_TTL_MS, useValue: 30 * 60 * 1000 }  // 30 min

// Force reload bypassing cache
await engine.loadTheme(id);                                // uses cache
await loader.load(id, { force: true });                   // bypasses cache
```
