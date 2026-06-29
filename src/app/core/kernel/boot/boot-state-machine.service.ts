import { Injectable, signal, computed } from '@angular/core';
import { KernelState, KernelStateTransition } from '../kernel.types';

export class InvalidKernelStateTransitionError extends Error {
  constructor(from: KernelState, to: KernelState) {
    super(`Invalid kernel state transition: ${from} → ${to}`);
    this.name = 'InvalidKernelStateTransitionError';
  }
}

const VALID_TRANSITIONS = new Map<KernelState, KernelState[]>([
  ['idle',          ['booting']],
  ['booting',       ['ready', 'degraded', 'error']],
  ['ready',         ['shutting-down']],
  ['degraded',      ['shutting-down']],
  ['error',         ['idle', 'shutting-down']],
  ['shutting-down', ['offline']],
  ['offline',       ['idle']],
]);

@Injectable({ providedIn: 'root' })
export class BootStateMachineService {
  private readonly _state = signal<KernelState>('idle');
  private readonly _history: KernelStateTransition[] = [];

  readonly state = computed(() => this._state());
  readonly isBooting = computed(() => this._state() === 'booting');
  readonly isReady = computed(() => this._state() === 'ready');
  readonly isDegraded = computed(() => this._state() === 'degraded');
  readonly isError = computed(() => this._state() === 'error');
  readonly isOffline = computed(() => this._state() === 'offline');

  canTransitionTo(to: KernelState): boolean {
    const allowed = VALID_TRANSITIONS.get(this._state());
    return allowed?.includes(to) ?? false;
  }

  transition(to: KernelState, trigger: string): void {
    const from = this._state();
    if (!this.canTransitionTo(to)) {
      throw new InvalidKernelStateTransitionError(from, to);
    }
    this._history.push({ from, to, trigger });
    this._state.set(to);
  }

  getHistory(): Readonly<KernelStateTransition[]> {
    return this._history;
  }

  reset(): void {
    this._state.set('idle');
    this._history.length = 0;
  }
}
