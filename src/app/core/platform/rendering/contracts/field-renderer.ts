import { FieldRenderRequest, FieldRendererConfig, FieldType, RenderMode, RenderOutput } from '../rendering.types';
import { RenderContext } from '../renderer-context';

export interface FieldRenderer {
  readonly fieldType: FieldType | string;
  readonly displayName: string;
  readonly supportedModes: ReadonlyArray<RenderMode>;
  canRender(fieldType: string): boolean;
  render(request: FieldRenderRequest, context: RenderContext): RenderOutput;
  getDefaultConfig(): FieldRendererConfig;
}
