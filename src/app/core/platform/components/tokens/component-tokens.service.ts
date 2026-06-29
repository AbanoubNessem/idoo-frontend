import { Injectable, signal, computed, inject } from '@angular/core';
import { ComponentTokenMap, ComponentTokenSet, ComponentDensity } from '../component.types';
import { DesignTokenRegistryService } from '../../ui/tokens/design-token-registry.service';
import { DensitySystemService } from '../../ui/tokens/density-system.service';

@Injectable({ providedIn: 'root' })
export class ComponentTokensService {
  private readonly tokenRegistry = inject(DesignTokenRegistryService);
  private readonly densitySystem = inject(DensitySystemService);

  private readonly _componentTokens = new Map<string, ComponentTokenSet>();
  private readonly _version         = signal(0);

  readonly tokenSetCount = computed(() => {
    this._version();
    return this._componentTokens.size;
  });

  /** Global component-level tokens shared across all components. */
  readonly globalTokens: ComponentTokenMap = {
    'component.border-width':      '1px',
    'component.focus-ring-width':  '2px',
    'component.focus-ring-color':  'var(--platform-color-primary)',
    'component.focus-ring-offset': '2px',
    'component.transition':        'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    'component.border-radius':     'var(--platform-border-radius-md, 0.375rem)',
    'component.font-family':       'var(--platform-typography-font-family-system)',
    'component.error-color':       'var(--platform-color-error)',
    'component.hint-color':        'var(--platform-color-text-secondary)',
    'component.label-color':       'var(--platform-color-text-primary)',
    'component.disabled-opacity':  '0.38',
    'component.skeleton-bg':       'var(--platform-color-surface-variant, #f1f5f9)',
  };

  registerTokenSet(tokenSet: ComponentTokenSet): void {
    this._componentTokens.set(tokenSet.componentKey, tokenSet);
    this._version.update(v => v + 1);
  }

  getTokenSet(componentKey: string): ComponentTokenSet | undefined {
    return this._componentTokens.get(componentKey);
  }

  /**
   * Resolves the effective token map for a component at the given density.
   * Merges: globalTokens → componentTokens → densityOverrides.
   */
  resolve(componentKey: string, density: ComponentDensity = 'comfortable'): ComponentTokenMap {
    const set  = this._componentTokens.get(componentKey);
    const base = { ...this.globalTokens };

    if (!set) return base;

    const merged = { ...base, ...set.tokens };

    const densityOverride = set.densityOverrides?.[density];
    if (densityOverride) {
      Object.assign(merged, densityOverride);
    }

    return merged;
  }

  /**
   * Converts a component token map to CSS custom property string suitable for
   * injection as an inline `style` attribute on the component host element.
   */
  toCssStyle(tokenMap: ComponentTokenMap): string {
    return Object.entries(tokenMap)
      .map(([k, v]) => `--${k.replace(/\./g, '-')}: ${v};`)
      .join(' ');
  }

  /**
   * Returns the density multiplier from the DensitySystemService.
   */
  getDensityMultiplier(): number {
    return this.densitySystem.config().multiplier;
  }

  /**
   * Scales a pixel value by the current density multiplier.
   */
  scale(basePx: number): string {
    return `${this.densitySystem.scale(basePx)}px`;
  }
}
