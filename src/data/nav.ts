// Header nav item id → route + i18n key mapping (design.md §3 `data/nav.ts`).
// Consumed by Header.astro; route is the logical (locale-free) path passed to
// `getRelativeLocaleUrl`.
import type { UIKey } from '../i18n';

export interface NavItem {
  id: 'about' | 'experience' | 'projects' | 'blog';
  route: string;
  labelKey: UIKey;
}

export const nav: NavItem[] = [
  { id: 'about', route: 'about', labelKey: 'nav.about' },
  { id: 'experience', route: 'experience', labelKey: 'nav.experience' },
  { id: 'projects', route: 'projects', labelKey: 'nav.projects' },
  { id: 'blog', route: 'blog', labelKey: 'nav.blog' },
];
