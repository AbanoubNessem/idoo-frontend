import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class FileRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'file';
  readonly displayName = 'File Upload';

  getDefaultConfig(): FieldRendererConfig {
    return {
      fieldType: 'file',
      props: {
        accept: '*/*',
        multiple: false,
        maxSizeMb: 10,
        showPreview: false,
      },
    };
  }
}
