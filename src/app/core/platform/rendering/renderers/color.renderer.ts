import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class ColorRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'color';
  readonly displayName = 'Color';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'color', props: { format: 'hex', showAlpha: false, showPreview: true } };
  }
}
