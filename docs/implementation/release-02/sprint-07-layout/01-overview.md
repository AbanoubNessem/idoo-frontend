# Sprint 7 — Enterprise Layout Engine — Overview

**Release:** 2  
**Sprint:** 7  
**Status:** Complete  
**Location:** `src/app/core/platform/layout/`

---

## Purpose

The Layout Engine is a metadata-driven, signal-based system that generates CSS layout for any Angular component from a declarative `LayoutDefinition`. It replaces all inline CSS layout logic in the Dynamic Form Engine and provides a unified layout API for the entire platform.

## What It Is Not

- It does not render HTML — only CSS properties.
- It does not contain business logic or ERP domain knowledge.
- It does not replace Angular's built-in routing, forms, or CDK.

## Design Principles

- **Metadata-driven:** All layouts are defined as plain objects (`LayoutDefinition`), never inline styles in templates.
- **Signal-based:** All reactive state uses Angular signals (`signal`, `computed`). No `BehaviorSubject` or `Observable` for UI state.
- **OnPush everywhere:** Every Angular component uses `ChangeDetectionStrategy.OnPush`.
- **RTL-first:** Every CSS rule uses logical properties or explicit RTL flipping.
- **No circular dependencies:** Dependency graph flows strictly downward from engine → services → primitives.

## Key Entry Points

| Consumer Need | Entry Point |
|---|---|
| Generate CSS for a layout | `LayoutRendererService.render()` |
| Register/resolve layouts | `LayoutEngineService` (facade) |
| Build layout definitions | `LayoutBuilderService` |
| Serialize/deserialize | `LayoutSerializerService` |
| Per-instance UI state | `LayoutState` class |
| Breakpoint/direction context | `LayoutContext` class |
| Form → Layout bridge | `FormLayoutAdapter` |
