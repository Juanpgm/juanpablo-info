// Decorative theme-aware neural-network node graph for the Hero background
// (post-launch fast-follow, design §7 ADR A1: vanilla-only islands, §8 motion
// contract). Pure ambient texture: aria-hidden, paused off-screen/tab-hidden,
// frozen to a single static frame under `prefers-reduced-motion: reduce`.
//
// ponytail: O(n²) pairwise distance check for line-drawing — fine at ~40
// nodes (≈780 pairs/frame); upgrade to a spatial grid only if node count
// grows an order of magnitude.

interface Node {
  x: number; // normalized [0,1], resize-independent
  y: number;
  vx: number;
  vy: number;
}

const NODE_COUNT = 40;
const MAX_LINK_DIST = 130; // CSS px
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

  const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    // Very slow drift — ambient texture, not an attention-grabbing effect.
    vx: (Math.random() - 0.5) * 0.00025,
    vy: (Math.random() - 0.5) * 0.00025,
  }));

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let width = 0;
  let height = 0;
  let nodeColor = '#0f766e';
  let lineColor = '#4b5563';
  let rafId = 0;
  let running = false;
  let intersecting = false;
  let resizeTimer = 0;

  function readColors(): void {
    const styles = getComputedStyle(document.documentElement);
    nodeColor = styles.getPropertyValue('--color-primary').trim() || nodeColor;
    lineColor = styles.getPropertyValue('--color-ink-muted').trim() || lineColor;
  }

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  function scheduleResize(): void {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, RESIZE_DEBOUNCE_MS);
  }

  function step(): void {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x <= 0 || n.x >= 1) n.vx *= -1;
      if (n.y <= 0 || n.y >= 1) n.vy *= -1;
      n.x = Math.min(1, Math.max(0, n.x));
      n.y = Math.min(1, Math.max(0, n.y));
    }
  }

  function render(): void {
    if (width === 0 || height === 0) return;
    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = (a.x - b.x) * width;
        const dy = (a.y - b.y) * height;
        const dist = Math.hypot(dx, dy);
        if (dist < MAX_LINK_DIST) {
          ctx.globalAlpha = (1 - dist / MAX_LINK_DIST) * 0.14;
          ctx.strokeStyle = lineColor;
          ctx.beginPath();
          ctx.moveTo(a.x * width, a.y * height);
          ctx.lineTo(b.x * width, b.y * height);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = nodeColor;
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x * width, n.y * height, 1.75, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop(): void {
    step();
    render();
    rafId = requestAnimationFrame(loop);
  }

  function shouldAnimate(): boolean {
    return !reduceMotionQuery.matches && !document.hidden && intersecting;
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

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      intersecting = entries[entries.length - 1]?.isIntersecting ?? false;
      syncRunState();
    },
    { threshold: 0.1 },
  );
  intersectionObserver.observe(canvas);

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
    intersectionObserver.disconnect();
    themeObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reduceMotionQuery.removeEventListener('change', onReduceMotionChange);
    window.removeEventListener('resize', scheduleResize);
  };
}
