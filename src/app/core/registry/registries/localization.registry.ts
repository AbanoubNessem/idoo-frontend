import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface LocalizationDef {
  locale: string;
  namespace: string;
  translations: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class LocalizationRegistryService extends BaseRegistry<LocalizationDef> {
  readonly name = 'localization';
  readonly mergeStrategy: MergeStrategy = 'DEEP';

  getTranslations(locale: string, namespace: string): Record<string, string> {
    const key = `${locale}:${namespace}`;
    return this.getById(key)?.definition.translations ?? {};
  }

  translate(locale: string, namespace: string, key: string, fallback = key): string {
    const translations = this.getTranslations(locale, namespace);
    return translations[key] ?? fallback;
  }
}
