import { Injectable, signal, computed } from '@angular/core';
import { MetadataEngineState } from './metadata.types';

type Transition = Readonly<Record<MetadataEngineState, ReadonlyArray<MetadataEngineState>>>;

const VALID_TRANSITIONS: Transition = {
  uninitialized: ['loading'],
  loading:       ['validating', 'error'],
  validating:    ['resolving', 'error'],
  resolving:     ['indexing', 'error'],
  indexing:      ['ready', 'error'],
  ready:         ['refreshing'],
  refreshing:    ['loading', 'error'],
  error:         ['loading'],
};

@Injectable({ providedIn: 'root' })
export class MetadataLifecycleService {
  private readonly _state = signal<MetadataEngineState>('uninitialized');
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _history: MetadataEngineState[] = [];
  private readonly MAX_HISTORY = 50;

  readonly state = computed(() => this._state());
  readonly isReady = computed(() => this._state() === 'ready');
  readonly isError = computed(() => this._state() === 'error');
  readonly isBusy = computed(() => {
    const s = this._state();
    return s === 'loading' || s === 'validating' || s === 'resolving' || s === 'indexing' || s === 'refreshing';
  });
  readonly errorMessage = computed(() => this._errorMessage());

  canTransitionTo(next: MetadataEngineState): boolean {
    return (VALID_TRANSITIONS[this._state()] as ReadonlyArray<MetadataEngineState>).includes(next);
  }

  transition(next: MetadataEngineState, errorMessage?: string): void {
    if (!this.canTransitionTo(next)) {
      throw new Error(
        `MetadataLifecycle: invalid transition ${this._state()} → ${next}`
      );
    }

    if (this._history.length >= this.MAX_HISTORY) {
      this._history.shift();
    }
    this._history.push(this._state());
    this._state.set(next);

    if (next === 'error' && errorMessage) {
      this._errorMessage.set(errorMessage);
    } else if (next !== 'error') {
      this._errorMessage.set(null);
    }
  }

  getHistory(): ReadonlyArray<MetadataEngineState> {
    return [...this._history];
  }

  reset(): void {
    this._state.set('uninitialized');
    this._errorMessage.set(null);
    this._history.length = 0;
  }
}
