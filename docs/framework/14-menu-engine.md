# iDoo ERP Platform — Menu Engine

---

## 1. Overview

The Menu Engine builds and renders the application navigation sidebar from a combination of plugin-registered `MenuItemDef` metadata and the current user's effective permissions. It handles module grouping, permission filtering, active state tracking, and collapsible behaviour — without any per-module menu configuration.

---

## 2. Menu Sources

The sidebar menu is built from two sources merged together at runtime:

| Source | Description |
|---|---|
| **Plugin-registered items** | Each plugin declares its `MenuItemDef[]` in `PluginDef.menu` |
| **Backend module list** | `GET /v1/modules` returns the tenant's active module list |

The Menu Engine merges both: only items whose `moduleCode` is in the backend active list are rendered. Items without a `moduleCode` are always rendered (platform items: Dashboard, Settings).

---

## 3. Menu Build Pipeline

```
AppRegistry.getAll(MenuRegistry)
        │
        ├── all MenuItemDef[] from all registered plugins
        │
        ├── filter: user has menuItem.permission
        ├── filter: menuItem.moduleCode is in active modules
        │
        ├── sort by menuItem.order
        │
        ├── group by menuItem.moduleCode (module section headers)
        │
        └── inject into SidebarComponent
```

---

## 4. MenuItemDef

See `06-metadata-system.md` §10 for the full interface. Summary:

```typescript
interface MenuItemDef {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  permission?: string;
  badge?: BadgeConfig;
  order?: number;
  children?: MenuItemDef[];
  dividerBefore?: boolean;
  moduleCode?: string;
}
```

Children create a collapsible submenu. Up to 2 levels of nesting are supported.

---

## 5. Sidebar Layout

```
┌─ Sidebar ──────────────────────┐
│  [iDoo ERP logo]               │
│  ─────────────────────────     │
│  ⊞ Dashboard                   │
│  ─────────────────────────     │
│  HUMAN RESOURCES               │
│  ├ 👥 Employees                │
│  ├ 🏢 Departments              │
│  └ 📋 Job Titles               │
│  ─────────────────────────     │
│  FLEET                         │
│  ├ 🚗 Vehicles                 │
│  └ 🛠 Maintenance              │
│  ─────────────────────────     │
│  ⚙ Settings        [avatar]   │
└────────────────────────────────┘
```

---

## 6. Active State

The active menu item is determined reactively from the current router URL. The `MenuEngine` computes:

```typescript
readonly activeItemId = computed(() => {
  const url = this.router.url();
  return this.allItems().find(item => url.startsWith(item.path ?? ''))?.id ?? null;
});
```

Active items receive an `active` CSS class. Parent items with an active child are auto-expanded.

---

## 7. Badge Counts

Menu items can show notification badges (e.g., pending approvals count). Badges are updated via the `MenuBadgeService`:

```typescript
class MenuBadgeService {
  setBadge(menuItemId: string, count: number): void;
  clearBadge(menuItemId: string): void;
}
```

Plugins that need live badge counts register a polling or WebSocket listener on init and call `setBadge()`.

---

## 8. Permission Filtering

The `MenuEngine` filters items reactively. When user permissions change (e.g., role assignment), the menu rebuilds automatically because it reads from `PermissionStateService` signals:

```typescript
readonly filteredItems = computed(() => {
  const permissions = this.permissionState.permissions();
  return this.allItems().filter(item =>
    !item.permission || permissions.has(item.permission)
  );
});
```

This means no page reload is needed when a super-admin adjusts a user's roles mid-session (though in practice this is a rare scenario).

---

## 9. Collapsed Mode

In collapsed mode (icon-only), the sidebar shows:
- Module section dividers as horizontal lines
- Items as icon-only buttons
- Tooltips with item labels on hover
- Children revealed in a fly-out panel on hover

---

## 10. Mobile Navigation

On mobile viewports, the sidebar is replaced with:
- A hamburger button in the topbar
- A full-screen drawer overlay with the menu
- A bottom tab bar for the top 5 most-used items (configurable per tenant)

---

## 11. Breadcrumb Integration

The `BreadcrumbService` uses the `MenuRegistry` to build breadcrumb trails:

```
Dashboard > Human Resources > Employees > John Doe
```

Each segment is a link derived from `MenuItemDef.path` and `EntityDef.labelSingular/labelPlural`.
