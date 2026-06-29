import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class NumberRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'number';
  readonly displayName = 'Number';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'number', props: { decimals: 0, min: null, max: null, step: 1 } };
  }
}
