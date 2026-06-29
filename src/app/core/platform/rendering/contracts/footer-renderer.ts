import { FooterRenderRequest, RenderOutput } from '../rendering.types';
import { RenderContext } from '../renderer-context';

export interface FooterRenderer {
  readonly displayName: string;
  render(request: FooterRenderRequest, context: RenderContext): RenderOutput;
}
