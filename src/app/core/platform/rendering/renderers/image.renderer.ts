import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class ImageRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'image';
  readonly displayName = 'Image';

  getDefaultConfig(): FieldRendererConfig {
    return {
      fieldType: 'image',
      props: { accept: 'image/*', maxSizeMb: 5, width: 120, height: 120, showPreview: true },
    };
  }
}
