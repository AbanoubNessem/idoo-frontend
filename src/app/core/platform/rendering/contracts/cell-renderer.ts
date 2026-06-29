import { CellRenderRequest, FieldType, RenderOutput } from '../rendering.types';
import { RenderContext } from '../renderer-context';

export interface CellRenderer {
  readonly fieldType: FieldType | string;
  readonly displayName: string;
  canRender(fieldType: string): boolean;
  render(request: CellRenderRequest, context: RenderContext): RenderOutput;
}
