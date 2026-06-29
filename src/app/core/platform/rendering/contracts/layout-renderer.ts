import { LayoutRenderRequest, RenderOutput } from '../rendering.types';
import { RenderContext } from '../renderer-context';

export interface LayoutRenderer {
  readonly layoutType: string;
  readonly displayName: string;
  canRender(layoutType: string): boolean;
  render(request: LayoutRenderRequest, context: RenderContext): RenderOutput;
}
