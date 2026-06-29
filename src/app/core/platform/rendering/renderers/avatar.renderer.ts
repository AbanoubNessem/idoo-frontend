import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class AvatarRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'avatar';
  readonly displayName = 'Avatar';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'avatar', props: { size: 40, shape: 'circle', showName: false } };
  }
}
