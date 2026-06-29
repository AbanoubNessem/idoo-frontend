import { Injectable, signal, computed, Signal } from '@angular/core';
import { StateSlice } from '../runtime.types';

class StateSliceImpl<T> implements StateSlice<T> {
  readonly key: string;
  private readonly _signal;
  private readonly _initialValue: T;
  readonly value: Signal<T>;

  constructor(key: string, initialValue: T) {
    this.key = key;
    this._initialValue = initialValue;
    this._signal = signal<T>(initialValue);
    this.value = computed(() => this._signal());
  }

  set(value: T): void {
    this._signal.set(value);
  }

  update(fn: (current: T) => T): void {
    this._signal.update(fn);
  }

  reset(): void {
    this._signal.set(this._initialValue);
  }
}

@Injectable({ providedIn: 'root' })
export class StateEngineService {
  private readonly slices = new Map<string, StateSliceImpl<unknown>>();

  create<T>(key: string, initialValue: T): StateSlice<T> {
    if (this.slices.has(key)) {
      console.warn(`StateEngine: slice '${key}' already exists. Returning existing.`);
      return this.slices.get(key) as StateSlice<T>;
    }

    const slice = new StateSliceImpl<T>(key, initialValue);
    this.slices.set(key, slice as StateSliceImpl<unknown>);
    return slice;
  }

  get<T>(key: string): StateSlice<T> | undefined {
    return this.slices.get(key) as StateSlice<T> | undefined;
  }

  getOrCreate<T>(key: string, initialValue: T): StateSlice<T> {
    return (this.get<T>(key) ?? this.create<T>(key, initialValue));
  }

  has(key: string): boolean {
    return this.slices.has(key);
  }

  remove(key: string): boolean {
    return this.slices.delete(key);
  }

  snapshot(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, slice] of this.slices.entries()) {
      result[key] = slice.value();
    }
    return result;
  }

  clear(): void {
    this.slices.clear();
  }

  listKeys(): string[] {
    return Array.from(this.slices.keys());
  }
}
