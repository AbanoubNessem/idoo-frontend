import { LayoutContext } from '../layout-context';

describe('LayoutContext', () => {
  let ctx: LayoutContext;

  beforeEach(() => { ctx = new LayoutContext(); });

  it('defaults to ltr direction', () => {
    expect(ctx.direction()).toBe('ltr');
  });

  it('setDirection updates the signal', () => {
    ctx.setDirection('rtl');
    expect(ctx.direction()).toBe('rtl');
  });

  it('setPermissions updates permissions signal', () => {
    ctx.setPermissions(['read', 'write']);
    expect(ctx.permissions()).toContain('read');
  });

  it('setModel replaces the model', () => {
    ctx.setModel({ foo: 'bar' });
    expect(ctx.model()['foo']).toBe('bar');
  });

  it('patchModel merges into existing model', () => {
    ctx.setModel({ a: 1 });
    ctx.patchModel({ b: 2 });
    const m = ctx.model();
    expect(m['a']).toBe(1);
    expect(m['b']).toBe(2);
  });

  it('setContainerSize updates breakpoint based on width', () => {
    ctx.setContainerSize(1024);
    // 1024 >= lg(992)
    expect(ctx.breakpoint()).toBe('lg');
  });

  it('returns xs breakpoint for very small container', () => {
    ctx.setContainerSize(300);
    expect(ctx.breakpoint()).toBe('xs');
  });

  it('snapshot returns a consistent view', () => {
    ctx.setDirection('rtl');
    ctx.setPermissions(['admin']);
    const snap = ctx.snapshot();
    expect(snap.direction).toBe('rtl');
    expect(snap.permissions).toContain('admin');
  });

  it('orientation is landscape when width > height', () => {
    ctx.setContainerSize(1280, 720);
    expect(ctx.orientation()).toBe('landscape');
  });

  it('orientation is portrait when height > width', () => {
    ctx.setContainerSize(400, 800);
    expect(ctx.orientation()).toBe('portrait');
  });
});
