# iDoo ERP Platform — Event Bus

---

## 1. Overview

The Event Bus is the decoupled communication channel between platform engines and plugins. It allows components and services to emit events and react to events from other parts of the system without direct dependencies. It is the primary mechanism for cross-plugin coordination.

---

## 2. Design Principles

- **Typed events** — all events are typed TypeScript interfaces, no `any` payloads
- **Scoped subscriptions** — subscribers can filter by event type
- **No memory leaks** — subscribers use `takeUntilDestroyed()` or `toSignal()`
- **Synchronous delivery** — events are delivered synchronously to all current subscribers
- **Not a state machine** — the Event Bus does not hold state; it only broadcasts

---

## 3. EventBus Service

```typescript
@Injectable({ providedIn: 'root' })
class EventBus {
  private readonly subject = new Subject<PlatformEvent>();

  emit(event: PlatformEvent): void {
    this.subject.next(event);
  }
  
  on<T extends PlatformEvent>(type: T['type']): Observable<T> {
    return this.subject.pipe(
      filter((e): e is T => e.type === type)
    );
  }
  
  onAny(): Observable<PlatformEvent> {
    return this.subject.asObservable();
  }
}
```

---

## 4. PlatformEvent Union Type

All events extend `PlatformEvent`. The union is open — plugins add their own event types:

```typescript
type PlatformEvent =
  // Core platform events
  | ActionCompletedEvent
  | ActionFailedEvent
  | RecordCreatedEvent
  | RecordUpdatedEvent
  | RecordDeletedEvent
  | ContextChangedEvent
  | SessionExpiredEvent
  | PermissionsRefreshedEvent
  // Plugin events (added by each plugin)
  | HrEmployeeStatusChangedEvent
  | FleetVehicleAssignedEvent
  // ... unlimited extension
  ;
```

---

## 5. Platform-Emitted Events

These events are emitted by the platform engines:

### ActionCompletedEvent
```typescript
interface ActionCompletedEvent {
  type: 'action:completed';
  actionId: string;
  entityId: string;
  context: ActionContext;
  result?: unknown;
}
```
Emitted by `ActionEngine` on successful action execution.

### RecordCreatedEvent
```typescript
interface RecordCreatedEvent {
  type: 'record:created';
  entityId: string;
  record: Record<string, unknown>;
}
```
Emitted by `ActionEngine` after a successful create operation.

### RecordUpdatedEvent
```typescript
interface RecordUpdatedEvent {
  type: 'record:updated';
  entityId: string;
  recordId: string;
  changes: Record<string, unknown>;
}
```

### RecordDeletedEvent
```typescript
interface RecordDeletedEvent {
  type: 'record:deleted';
  entityId: string;
  recordId: string;
}
```

### ContextChangedEvent
```typescript
interface ContextChangedEvent {
  type: 'context:changed';
  previousContext: AppContext;
  newContext: AppContext;
}
```
Emitted when the user switches company or branch.

### SessionExpiredEvent
```typescript
interface SessionExpiredEvent {
  type: 'session:expired';
}
```
Emitted by `AuthFacade` when the refresh token is exhausted.

### PermissionsRefreshedEvent
```typescript
interface PermissionsRefreshedEvent {
  type: 'permissions:refreshed';
  permissions: string[];
}
```

---

## 6. Platform Reactions to Events

The platform automatically reacts to certain events:

| Event | Platform Reaction |
|---|---|
| `action:completed` | `TableEngine` refreshes if `entityId` matches its current entity |
| `record:created` | `TableEngine` refreshes, navigates to new record if configured |
| `record:deleted` | `TableEngine` refreshes, navigates back to list if viewing deleted record |
| `context:changed` | All `EntityDataSource` instances refetch their data |
| `session:expired` | `AuthFacade` redirects to `/login` |

---

## 7. Plugin-Defined Events

Plugins define their own event types in their type declarations:

```typescript
// In fleet plugin types:
interface FleetVehicleAssignedEvent {
  type: 'fleet:vehicle:assigned';
  vehicleId: string;
  driverId: string;
  assignedAt: string;
}
```

And extend the union type (via module augmentation):

```typescript
// In fleet plugin's events.ts:
declare module '@idoo/platform' {
  interface PlatformEventMap {
    'fleet:vehicle:assigned': FleetVehicleAssignedEvent;
  }
}
```

---

## 8. Usage Examples

### Emitting from a plugin action handler

```typescript
const AssignDriverAction: ActionDef = {
  id: 'assign-driver',
  // ...
  handler: (ctx) => {
    const eventBus = inject(EventBus);
    return this.vehicleApi.assignDriver(ctx.row!['id'], ctx.formValue!['driverId']).pipe(
      tap(result => eventBus.emit({
        type: 'fleet:vehicle:assigned',
        vehicleId: ctx.row!['id'] as string,
        driverId: ctx.formValue!['driverId'] as string,
        assignedAt: new Date().toISOString(),
      }))
    );
  }
};
```

### Reacting in another plugin

```typescript
// In HR plugin's dashboard widget:
constructor() {
  inject(EventBus)
    .on<FleetVehicleAssignedEvent>('fleet:vehicle:assigned')
    .pipe(takeUntilDestroyed())
    .subscribe(event => {
      // Update driver's assignment in HR view
      this.refresh();
    });
}
```

---

## 9. EventBus vs Signals

The Event Bus is for one-time notifications (something happened). Signals are for state (what is currently true).

| Scenario | Use |
|---|---|
| A record was just deleted | Event Bus |
| The current user's permissions | Signal |
| The user clicked "Export" | Event Bus |
| Whether the sidebar is collapsed | Signal |
| A background job completed | Event Bus |
| The active branch context | Signal |
