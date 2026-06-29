import { inject, Injectable, signal, computed } from '@angular/core';
import { FormSnapshot, FieldState } from '../form.types';
import { DynamicFormState } from '../state/dynamic-form-state';

const DRAFT_PREFIX = 'df_draft_';
let _snapCounter = 0;

@Injectable({ providedIn: 'root' })
export class DynamicFormSnapshotService {
  private readonly _snapshots = signal<FormSnapshot[]>([]);

  readonly count    = computed(() => this._snapshots().length);
  readonly all      = this._snapshots.asReadonly();

  capture(
    formId: string,
    state: DynamicFormState,
    label?: string,
  ): FormSnapshot {
    const snapshot: FormSnapshot = {
      id:           `snap-${++_snapCounter}-${Date.now()}`,
      formId,
      capturedAt:   new Date().toISOString(),
      model:        { ...state.model() },
      fieldStates:  state.snapshot(),
      sectionStates: { ...state.sectionStates() },
      phase:        state.phase(),
      label,
    };

    this._snapshots.update(snaps => [...snaps, snapshot]);
    return snapshot;
  }

  restore(snapshot: FormSnapshot, state: DynamicFormState): void {
    state.restoreSnapshot(snapshot.fieldStates);
  }

  saveDraft(formId: string, snapshot: FormSnapshot): void {
    try {
      localStorage.setItem(
        `${DRAFT_PREFIX}${formId}`,
        JSON.stringify(snapshot),
      );
    } catch {
      // localStorage may be unavailable in SSR or restricted environments
    }
  }

  loadDraft(formId: string): FormSnapshot | null {
    try {
      const raw = localStorage.getItem(`${DRAFT_PREFIX}${formId}`);
      if (!raw) return null;
      return JSON.parse(raw) as FormSnapshot;
    } catch {
      return null;
    }
  }

  clearDraft(formId: string): void {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${formId}`);
    } catch {
      // noop
    }
  }

  hasDraft(formId: string): boolean {
    try {
      return localStorage.getItem(`${DRAFT_PREFIX}${formId}`) !== null;
    } catch {
      return false;
    }
  }

  get(id: string): FormSnapshot | undefined {
    return this._snapshots().find(s => s.id === id);
  }

  forForm(formId: string): FormSnapshot[] {
    return this._snapshots().filter(s => s.formId === formId);
  }

  remove(id: string): void {
    this._snapshots.update(snaps => snaps.filter(s => s.id !== id));
  }

  clearForm(formId: string): void {
    this._snapshots.update(snaps => snaps.filter(s => s.formId !== formId));
  }
}
