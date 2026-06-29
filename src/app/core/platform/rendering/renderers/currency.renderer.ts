import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class CurrencyRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'currency';
  readonly displayName = 'Currency';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'currency', props: { currency: 'USD', locale: 'en-US', decimals: 2 } };
  }
}
