import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class ChipRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'chip';
  readonly displayName = 'Chip';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'chip', props: { removable: false, color: 'default', maxItems: null } };
  }
}
