import { computed, signal } from '@angular/core';
import { FieldState, FormHistoryEntry, FormSnapshot } from '../form.types';

let _entryCounter = 0;

function newEntryId(): string {
  return `fh-${++_entryCounter}-${Date.now()}`;
}

// ─── DynamicFormHistory ──────────────────────────────────────────────────────

export class DynamicFormHistory {
  private readonly _entries  = signal<FormHistoryEntry[]>([]);
  private readonly _index    = signal(-1);
  private readonly _maxSize: number;

  readonly canUndo = computed(() => this._index() > 0);
  readonly canRedo = computed(() => this._index() < this._entries().length - 1);
  readonly size    = computed(() => this._entries().length);
  readonly entries = this._entries.asReadonly();

  constructor(maxSize = 50) {
    this._maxSize = maxSize;
  }

  push(snapshot: FormSnapshot, action = 'change'): void {
    const entries = this._entries();
    const currentIndex = this._index();

    // Discard redo entries beyond current position
    const base = entries.slice(0, currentIndex + 1);

    const entry: FormHistoryEntry = {
      index:     base.length,
      snapshot,
      action,
      timestamp: new Date().toISOString(),
    };

    const next = [...base, entry];

    // Trim to maxSize
    const trimmed = next.length > this._maxSize
      ? next.slice(next.length - this._maxSize)
      : next;

    // Re-index after trim
    const reindexed: FormHistoryEntry[] = trimmed.map((e, i) => ({ ...e, index: i }));

    this._entries.set(reindexed);
    this._index.set(reindexed.length - 1);
  }

  undo(): FormSnapshot | null {
    const current = this._index();
    if (current <= 0) return null;
    const nextIndex = current - 1;
    this._index.set(nextIndex);
    return this._entries()[nextIndex]?.snapshot ?? null;
  }

  redo(): FormSnapshot | null {
    const current = this._index();
    const entries = this._entries();
    if (current >= entries.length - 1) return null;
    const nextIndex = current + 1;
    this._index.set(nextIndex);
    return entries[nextIndex]?.snapshot ?? null;
  }

  peek(): FormSnapshot | null {
    const idx = this._index();
    return idx >= 0 ? this._entries()[idx]?.snapshot ?? null : null;
  }

  clear(): void {
    this._entries.set([]);
    this._index.set(-1);
  }
}

// ─── Snapshot Builder ─────────────────────────────────────────────────────────

export function buildSnapshot(
  formId: string,
  model: Record<string, unknown>,
  fieldStates: Record<string, FieldState>,
  label?: string,
): FormSnapshot {
  return {
    id:           newEntryId(),
    formId,
    capturedAt:   new Date().toISOString(),
    model:        { ...model },
    fieldStates:  structuredClone(fieldStates),
    sectionStates: {},
    phase:        'ready',
    label,
  };
}
