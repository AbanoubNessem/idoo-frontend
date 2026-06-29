import { HeaderRenderRequest, RenderOutput } from '../rendering.types';
import { RenderContext } from '../renderer-context';

export interface HeaderRenderer {
  readonly displayName: string;
  render(request: HeaderRenderRequest, context: RenderContext): RenderOutput;
}
