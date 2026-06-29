import { Injectable, inject, signal, computed } from '@angular/core';
import { RuntimeStatus } from './runtime.types';
import { StateEngineService } from './engines/state-engine.service';
import { CacheEngineService } from './engines/cache-engine.service';
import { QueryEngineService } from './engines/query-engine.service';
import { NavigationEngineService } from './engines/navigation-engine.service';
import { ExpressionEngineService } from './engines/expression-engine.service';
import { ValidationEngineService } from './engines/validation-engine.service';
import { RuleEngineService } from './engines/rule-engine.service';
import { FormulaEngineService } from './engines/formula-engine.service';
import { EventBusService } from './events/event-bus.service';
import { RuntimeContextService } from './runtime-context.service';

@Injectable({ providedIn: 'root' })
export class RuntimeCoreService {
  readonly state = inject(StateEngineService);
  readonly cache = inject(CacheEngineService);
  readonly query = inject(QueryEngineService);
  readonly navigation = inject(NavigationEngineService);
  readonly expressions = inject(ExpressionEngineService);
  readonly validation = inject(ValidationEngineService);
  readonly rules = inject(RuleEngineService);
  readonly formulas = inject(FormulaEngineService);
  readonly events = inject(EventBusService);
  readonly context = inject(RuntimeContextService);

  private readonly _status = signal<RuntimeStatus>('idle');
  readonly status = computed(() => this._status());
  readonly isReady = computed(() => this._status() === 'ready');

  initialize(): void {
    if (this._status() !== 'idle') return;

    this._status.set('initializing');

    try {
      this.cache.configure({ maxSize: 2000 });
      this._status.set('ready');
      this.events.emit('runtime:initialized', { timestamp: new Date().toISOString() }, 'runtime');
    } catch (err) {
      this._status.set('error');
      console.error('RuntimeCore initialization failed:', err);
    }
  }

  reset(): void {
    this.state.clear();
    this.cache.clear();
    this.rules.clear();
    this.formulas.clear();
    this.expressions.clearCache();
    this.events.clearLog();
    this._status.set('idle');
  }

  getStatus(): RuntimeStatus {
    return this._status();
  }

  getDiagnostics(): {
    status: RuntimeStatus;
    cacheStats: ReturnType<CacheEngineService['getStats']>;
    stateSlices: string[];
    ruleCount: number;
    formulaCount: number;
    eventLogSize: number;
  } {
    return {
      status: this._status(),
      cacheStats: this.cache.getStats(),
      stateSlices: this.state.listKeys(),
      ruleCount: this.rules.listRuleIds().length,
      formulaCount: 0,
      eventLogSize: this.events.getLog().length,
    };
  }
}
