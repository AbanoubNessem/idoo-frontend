import { Injectable } from '@angular/core';
import { LifecycleHookFn, LifecycleHookType } from '../kernel.types';

@Injectable({ providedIn: 'root' })
export class LifecycleManagerService {
  private readonly hooks = new Map<LifecycleHookType, LifecycleHookFn[]>();

  on(type: LifecycleHookType, fn: LifecycleHookFn): () => void {
    if (!this.hooks.has(type)) {
      this.hooks.set(type, []);
    }
    this.hooks.get(type)!.push(fn);

    return () => {
      const list = this.hooks.get(type);
      if (list) {
        const idx = list.indexOf(fn);
        if (idx !== -1) list.splice(idx, 1);
      }
    };
  }

  async emit(type: LifecycleHookType): Promise<void> {
    const fns = this.hooks.get(type) ?? [];
    for (const fn of fns) {
      await fn();
    }
  }

  clear(type?: LifecycleHookType): void {
    if (type) {
      this.hooks.delete(type);
    } else {
      this.hooks.clear();
    }
  }

  hookCount(type: LifecycleHookType): number {
    return this.hooks.get(type)?.length ?? 0;
  }
}
