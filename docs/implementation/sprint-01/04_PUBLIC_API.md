# Sprint 1 — Public API Reference

**Sprint:** Sprint 1 — Platform Core Foundation  
**Date:** 2026-06-28  

---

## 1. Bootstrap API

### providePlatform(config?)

```typescript
import { providePlatform } from './core/kernel';

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    providePlatform({
      apiUrl: 'https://api.example.com',
      production: true,
      platformVersion: '1.0.0',
    }),
    providePlugin(hrManifest),
    providePlugin(financeManifest),
  ],
};
```

Provides: `PLATFORM_CONFIG_TOKEN`, `APP_INITIALIZER` (boots kernel), `KERNEL_TOKEN`.

### providePlugin(manifest)

```typescript
import { providePlugin } from './core/plugin';

providePlugin({
  id: 'HR_MODULE',
  name: 'HR Module',
  version: '1.0.0',
  minimumPlatformVersion: '^1.0.0',
  category: 'erp',
  author: { name: 'iDoo Platform Team' },
  entities: [hrEmployeeEntity],
  forms: [hrEmployeeForm],
  tables: [hrEmployeeTable],
  routes: [hrEmployeeRoute],
  menus: [hrMenuItem],
  permissions: [...hrPermissions],
});
```

---

## 2. Kernel API

### KernelFacadeService

Inject via `KernelFacadeService` or via `KERNEL_TOKEN`.

```typescript
kernel.state           // Signal<KernelState>
kernel.isReady         // Signal<boolean>
kernel.isDegraded      // Signal<boolean>
kernel.bootError       // Signal<Error | null>
kernel.hasPermission(code: string)     // boolean
kernel.hasAnyPermission(codes)         // boolean
kernel.isModuleActive(moduleId)        // boolean
kernel.isFeatureEnabled(flagId)        // boolean
kernel.currentUser                     // Signal<UserContext | null>
kernel.getVersion()                    // PlatformVersion
kernel.satisfiesVersion(range)         // boolean
kernel.runHealthChecks()               // Promise<KernelHealthReport>
kernel.getDiagnostics()               // DiagnosticsReport
kernel.on(type, fn)                    // () => void (unsubscribe)
```

### PlatformContextService

```typescript
context.setAuthenticated(user, permissions)
context.clearAuth()
context.setTenant(tenantId)
context.setCompany(companyId)
context.setBranch(branchId)
context.hasPermission(code)    // boolean
context.snapshot()             // PlatformContextSnapshot
```

---

## 3. Registry API

### BaseRegistry<TDef>

```typescript
registry.register(id, def, pluginId, version)
registry.get(id)              // RegistryEntry<TDef> | undefined
registry.getDefinition(id)    // TDef | undefined
registry.getAll()             // RegistryEntry<TDef>[]
registry.has(id)              // boolean
registry.publish()
registry.getDiagnostics()     // RegistryDiagnosticsReport
registry.getEvents()          // RegistryEvent[]
registry.clear()
```

### Specialized Registry Extras

```typescript
// MenuRegistry
menuRegistry.getTopLevel()             // MenuItemDef[]
menuRegistry.getChildrenOf(parentId)   // MenuItemDef[]
menuRegistry.getSortedAll()            // MenuItemDef[]

// ActionRegistry
actionRegistry.getForEntity(entityId)  // ActionDef[]
actionRegistry.getForScope(scope)      // ActionDef[]

// ThemeRegistry
themeRegistry.getDefault()             // ThemeDef | undefined

// LocalizationRegistry
localizationRegistry.getTranslations(locale)  // Record<string, string>
localizationRegistry.translate(locale, key, params?)  // string

// ValidationRegistry
validationRegistry.getValidator(id, params?, message?)  // ValidatorFn
```

### RegistryManagerService

```typescript
manager.publishAll()
manager.getOverallStatus()     // RegistryStatus
manager.getDiagnostics()       // RegistryDiagnosticsReport[]
manager.getStatistics()        // { totalRegistries, totalEntries, byRegistry }
manager.clearAll()
manager.isPublished()          // boolean
```

---

## 4. Plugin API

### PluginHostService

```typescript
host.initializeAll()           // Promise<void>
host.getDiagnostics()          // PluginDiagnosticsReport
host.getSuccessful()           // PluginRuntimeEntry[]
host.getFailed()               // PluginRuntimeEntry[]
host.getLoadedPluginIds()      // string[]
host.getFailedPluginIds()      // string[]
```

### PluginContext (in initFn)

```typescript
// Available inside plugin initFn(ctx: PluginContext):
ctx.pluginId
ctx.logger.info(msg, meta?)
ctx.logger.warn(msg, meta?)
ctx.logger.error(msg, meta?)
ctx.events.emit(type, payload)
ctx.events.on(type, handler)
ctx.featureFlags.isEnabled(flagId)   // boolean
ctx.config                           // PluginConfigPublic
```

---

## 5. SDK API

### define*() Functions

```typescript
import {
  definePlugin, defineEntity, defineForm, defineTable,
  defineAction, definePermission, defineMenu, defineRoute,
  defineWidget, defineDashboard, defineWorkflow,
  defineLookup, defineReport, defineValidator,
} from './core/sdk';

const entity = defineEntity({
  id: 'hr:employee',
  apiPath: '/v1/hr/employees',
  labelSingular: 'Employee',
  labelPlural: 'Employees',
  labelField: 'fullName',
  icon: 'person',
  permissions: { list: 'HR:EMPLOYEES:READ' },
});
```

All define functions return frozen objects with defaults applied and (in dev) validation errors thrown as `SDKValidationError`.

### Builders

```typescript
// EntityBuilder
const entity = EntityBuilder.create('hr:employee')
  .withApiPath('/v1/hr/employees')
  .withLabels('Employee', 'Employees')
  .withIcon('person')
  .withPermissions({ list: 'HR:EMPLOYEES:READ' })
  .build();

// FormBuilder
const form = FormBuilder.create()
  .addSection('main', 'General Information')
  .addField('main', { key: 'fullName', type: 'text', label: 'Full Name', required: true })
  .addField('main', { key: 'email', type: 'email', label: 'Email' })
  .build();
```

### Permission Helpers

```typescript
import { createPermissions, permissionDefsFromModule } from './core/sdk';

// Type-safe permission constants
const HR_PERMISSIONS = createPermissions('HR', ['EMPLOYEES', 'CONTRACTS']);
// HR_PERMISSIONS.EMPLOYEES.READ === 'HR:EMPLOYEES:READ'

// PermissionDef array for plugin registration
const permissionDefs = permissionDefsFromModule('HR', ['EMPLOYEES', 'CONTRACTS'], {
  EMPLOYEES: { READ: 'View Employees', CREATE: 'Add Employee', UPDATE: 'Edit Employee', DELETE: 'Remove Employee' },
});
```

### Metadata Helpers

```typescript
import { withDefaults, pick, omit, extendForm, extendTable, createActionsColumn } from './core/sdk';

// Extend a form with additional fields
const extendedForm = extendForm(baseForm, {
  addSections: [{ id: 'audit', fields: [{ key: 'createdBy', type: 'text', label: 'Created By' }] }],
  addFields: [{ sectionId: 'main', field: { key: 'notes', type: 'textarea', label: 'Notes' } }],
});

// Add actions column to table
const tableWithActions = extendTable(baseTable, {
  addColumns: [createActionsColumn()],
});
```

---

## 6. Runtime API

### EventBusService

```typescript
bus.emit(type, payload, source?)
bus.on(type)              // Observable<PlatformEvent>
bus.onPattern(regex)      // Observable<PlatformEvent>
bus.onSource(source)      // Observable<PlatformEvent>
bus.getLog()              // PlatformEvent[]
bus.getLogByType(type)    // PlatformEvent[]
bus.clearLog()
```

### StateEngineService

```typescript
const slice = stateEngine.createSlice<MyState>('mySlice', initialValue);
slice.get()               // MyState (signal read)
slice.set(value)
slice.update(updater)     // updater: (prev: MyState) => MyState
slice.reset()
slice.select(projector)   // Signal<R>
stateEngine.getSlice('mySlice')  // StateSlice<any> | undefined
```

### CacheEngineService

```typescript
cache.set(key, value, ttlMs?)
cache.get<T>(key)         // T | undefined
cache.has(key)            // boolean
cache.delete(key)
cache.deleteByPattern(pattern)  // RegExp
cache.clear()
cache.getStats()          // { size, hitCount, missCount }
```

### QueryEngineService

```typescript
query.getAll<T>(path, params?)          // Observable<T[]>
query.getById<T>(path, id)             // Observable<T>
query.create<T>(path, body)            // Observable<T>
query.update<T>(path, id, body)        // Observable<T>
query.patch<T>(path, id, body)         // Observable<T>
query.delete(path, id)                 // Observable<void>
query.search<T>(path, params)          // Observable<PagedResult<T>>
query.invalidateCache(pathPrefix)
```

### AbstractDataProvider<T>

```typescript
// Extend in business modules:
@Injectable({ providedIn: 'root' })
export class EmployeeDataProvider extends AbstractDataProvider<Employee> {
  protected override apiPath = '/v1/hr/employees';
}

// Usage:
provider.getAll()
provider.getById(id)
provider.create(dto)
provider.update(id, dto)
provider.delete(id)
provider.search(params)
```

### ExpressionEngineService

```typescript
engine.evaluate(expression, context)   // unknown
engine.validate(expression)            // { valid: boolean; error?: string }
```

### RuleEngineService

```typescript
engine.register({ id, condition, action })
engine.evaluate(context)               // RuleEvaluationResult[]
engine.evaluateFirst(context)          // RuleEvaluationResult | undefined
engine.unregister(id)
engine.has(id)                         // boolean
engine.listRuleIds()                   // string[]
engine.clear()
```

### FormulaEngineService

```typescript
engine.register(id, expression)
engine.evaluate(id, context)           // unknown
engine.unregister(id)
engine.has(id)                         // boolean
engine.listFormulas()                  // string[]
engine.clearAll()
```
