import { Injectable, inject, signal, computed } from '@angular/core';
import { DensityConfig, DensityLevel } from '../ui.types';
import { DesignTokenRegistryService } from './design-token-registry.service';

const DENSITY_CONFIGS: Readonly<Record<DensityLevel, DensityConfig>> = {
  spacious: {
    level: 'spacious',
    multiplier: 1.25,
    baseSpacingPx: 5,
    touchTargetPx: 52,
  },
  comfortable: {
    level: 'comfortable',
    multiplier: 1.0,
    baseSpacingPx: 4,
    touchTargetPx: 44,
  },
  compact: {
    level: 'compact',
    multiplier: 0.75,
    baseSpacingPx: 3,
    touchTargetPx: 36,
  },
};

@Injectable({ providedIn: 'root' })
export class DensitySystemService {
  private readonly tokenRegistry = inject(DesignTokenRegistryService);
  private readonly _level = signal<DensityLevel>('comfortable');

  readonly level = computed(() => this._level());
  readonly config = computed(() => DENSITY_CONFIGS[this._level()]);
  readonly multiplier = computed(() => this.config().multiplier);

  setLevel(level: DensityLevel): void {
    this._level.set(level);
    this.registerTokens();
  }

  getConfig(level?: DensityLevel): DensityConfig {
    return DENSITY_CONFIGS[level ?? this._level()];
  }

  scale(basePx: number): number {
    return Math.round(basePx * this.multiplier());
  }

  scaleRem(basePx: number): string {
    const scaled = this.scale(basePx);
    return scaled === 0 ? '0' : `${scaled / 16}rem`;
  }

  registerTokens(): void {
    const cfg = this.config();
    this.tokenRegistry.register(
      DesignTokenRegistryService.buildToken('density.level', 'density', cfg.level),
    );
    this.tokenRegistry.register(
      DesignTokenRegistryService.buildToken('density.multiplier', 'density', cfg.multiplier),
    );
    this.tokenRegistry.register(
      DesignTokenRegistryService.buildToken('density.base-spacing', 'density', `${cfg.baseSpacingPx}px`),
    );
    this.tokenRegistry.register(
      DesignTokenRegistryService.buildToken('density.touch-target', 'density', `${cfg.touchTargetPx}px`),
    );
  }

  getAllLevels(): ReadonlyArray<DensityLevel> {
    return ['spacious', 'comfortable', 'compact'];
  }
}
