import { TestBed } from '@angular/core/testing';
import { LayoutEngineService } from '../layout-engine.service';
import { LayoutDefinition } from '../layout.types';

describe('Layout Engine — Performance Benchmarks', () => {
  let engine: LayoutEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine = TestBed.inject(LayoutEngineService);
  });

  afterEach(() => {
    for (let i = 0; i < 100; i++) {
      engine.destroy(`perf-${i}`);
    }
  });

  it('resolves 100 definitions in under 200ms', () => {
    const defs: LayoutDefinition[] = Array.from({ length: 100 }, (_, i) => ({
      id: `perf-${i}`,
      type: 'grid',
      config: { grid: { columns: (i % 12) + 1 } },
    }));

    const start = performance.now();
    for (const def of defs) {
      engine.resolve(def);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
  });

  it('creates and destroys 50 instances in under 300ms', () => {
    const start = performance.now();

    for (let i = 0; i < 50; i++) {
      engine.create({ id: `perf-${i}`, type: 'flex' });
    }
    for (let i = 0; i < 50; i++) {
      engine.destroy(`perf-${i}`);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(300);
  });

  it('renders 50 responsive definitions with breakpoint overrides in under 300ms', () => {
    const def: LayoutDefinition = {
      id: 'perf-resp',
      type: 'flex',
      config: { flex: { direction: 'row' } },
      responsive: {
        xs: { config: { flex: { direction: 'column' } } },
        md: { config: { flex: { direction: 'row' } } },
        xl: { config: { gap: '24px' } },
      },
    };

    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
    const start = performance.now();

    for (let i = 0; i < 50; i++) {
      engine.resolve(def, { breakpoint: breakpoints[i % 6] });
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(300);
    engine.destroy('perf-resp');
  });

  it('builder creates 200 definitions in under 100ms', () => {
    const start = performance.now();
    for (let i = 0; i < 200; i++) {
      engine.builder.grid(`bench-${i}`, (i % 12) + 1).slot({ id: `s${i}` }).build();
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
