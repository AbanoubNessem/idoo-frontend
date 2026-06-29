import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class BadgeRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'badge';
  readonly displayName = 'Badge';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'badge', props: { colorMap: {}, defaultColor: 'default' } };
  }
}
