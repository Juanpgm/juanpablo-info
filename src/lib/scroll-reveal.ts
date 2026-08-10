// Shared vanilla scroll-reveal utility (design §"Motion").
// Any element with `data-reveal` gets `.is-visible` added once it enters the
// viewport; CSS (global.css) handles the opacity/translateY transition.
// Component PRs (Phase 3+) opt in per-section by adding `data-reveal`.
//
// ponytail: one shared IntersectionObserver instance is plenty at this
// content scale; revisit only if hundreds of reveal targets appear per page.
export function initScrollReveal(root: ParentNode = document): void {
  const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
  if (targets.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  );

  targets.forEach((el) => observer.observe(el));
}
