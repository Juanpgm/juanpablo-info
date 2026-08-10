// Decorative theme-aware "deep learning" network diagram — global fixed page
// background (post-launch fast-follow, design §7 ADR A1: vanilla-only
// islands, §8 motion contract). Pure ambient texture: aria-hidden, frozen to
// a single static frame under `prefers-reduced-motion: reduce`, paused while
// the tab is hidden.
//
// Layered feed-forward diagram, not a random particle field: nodes sit in
// LAYER_SIZES.length fixed columns, connected only to the adjacent layer
// (classic dense/fully-connected look) — cheaper than the old O(n²) all-pairs
// distance check it replaces (only adjacent-layer pairs, no distance test).
//
// ponytail: mounted once as a fixed full-viewport backdrop (see
// BaseLayout.astro) — no longer needs its own IntersectionObserver
// off-screen guard, a "background behind everything" is always on-screen
// while the tab is open. document.visibilitychange still pauses it for a
// backgrounded tab.

interface Node {
  baseX: number; // normalized [0,1] layer column position, fixed
  baseY: number; // normalized [0,1] slot position within its layer, fixed
  phaseX: number; // idle-jitter phase offsets, randomized per node
  phaseY: number;
}

const LAYER_SIZES = [5, 8, 10, 8, 5]; // hourglass shape reads as a real net diagram
const JITTER_AMP_X = 0.006; // normalized — texture only, columns stay visually crisp
const JITTER_AMP_Y = 0.015;
const JITTER_TIME_STEP = 0.006;
const LINE_ALPHA = 0.2;
const NODE_ALPHA = 0.38;
const NODE_RADIUS = 1.75; // CSS px
const MAX_DPR = 2;
const RESIZE_DEBOUNCE_MS = 150;

export function initNetworkCanvas(canvas: HTMLCanvasElement): () => void {
  const ctx2d = canvas.getContext('2d');
  if (!ctx2d) return () => {};
  // Re-bind to a definitely-non-null const: TS strict-null narrowing of
  // `ctx2d` doesn't survive into the nested closures below (a known
  // TS control-flow-analysis limitation with functions capturing outer
  // `const`s), so the nested functions reference this one instead.
  const ctx: CanvasRenderingContext2D = ctx2d;

  const layers: Node[][] = LAYER_SIZES.map((count, layerIndex) =>
    Array.from({ length: count }, (_, slotIndex) => ({
      baseX: (layerIndex + 1) / (LAYER_SIZES.length + 1),
      baseY: (slotIndex + 1) / (count + 1),
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
    })),
  );

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let width = 0;
  let height = 0;
  let nodeColor = '#0f766e';
  let lineColor = '#4b5563';
  let rafId = 0;
  let running = false;
  let resizeTimer = 0;
  let t = 0;

  function readColors(): void {
    const styles = getComputedStyle(document.documentElement);
    nodeColor = styles.getPropertyValue('--color-primary').trim() || nodeColor;
    lineColor = styles.getPropertyValue('--color-ink-muted').trim() || lineColor;
  }

  function resize(): void {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  function scheduleResize(): void {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, RESIZE_DEBOUNCE_MS);
  }

  function nodeX(n: Node): number {
    return n.baseX + Math.sin(t + n.phaseX) * JITTER_AMP_X;
  }

  function nodeY(n: Node): number {
    return n.baseY + Math.sin(t * 0.8 + n.phaseY) * JITTER_AMP_Y;
  }

  function step(): void {
    t += JITTER_TIME_STEP;
  }

  function render(): void {
    if (width === 0 || height === 0) return;
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = lineColor;
    ctx.globalAlpha = LINE_ALPHA;
    for (let i = 0; i < layers.length - 1; i++) {
      for (const a of layers[i]) {
        const ax = nodeX(a) * width;
        const ay = nodeY(a) * height;
        for (const b of layers[i + 1]) {
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(nodeX(b) * width, nodeY(b) * height);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = NODE_ALPHA;
    ctx.fillStyle = nodeColor;
    for (const layer of layers) {
      for (const n of layer) {
        ctx.beginPath();
        ctx.arc(nodeX(n) * width, nodeY(n) * height, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(): void {
    step();
    render();
    rafId = requestAnimationFrame(loop);
  }

  function shouldAnimate(): boolean {
    return !reduceMotionQuery.matches && !document.hidden;
  }

  function syncRunState(): void {
    if (shouldAnimate()) {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(loop);
      }
    } else if (running) {
      running = false;
      cancelAnimationFrame(rafId);
    }
    // Reduced motion (or simply paused) still gets one correct static frame.
    if (!running) render();
  }

  readColors();
  resize();
  syncRunState();

  const themeObserver = new MutationObserver(() => {
    readColors();
    if (!running) render();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const onVisibilityChange = () => syncRunState();
  const onReduceMotionChange = () => syncRunState();

  document.addEventListener('visibilitychange', onVisibilityChange);
  reduceMotionQuery.addEventListener('change', onReduceMotionChange);
  window.addEventListener('resize', scheduleResize);

  return function cleanup(): void {
    if (running) cancelAnimationFrame(rafId);
    running = false;
    window.clearTimeout(resizeTimer);
    themeObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reduceMotionQuery.removeEventListener('change', onReduceMotionChange);
    window.removeEventListener('resize', scheduleResize);
  };
}
