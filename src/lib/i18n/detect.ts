/**
 * NEXUS i18n — Auto-detection bilingual system (AR / EN)
 * No toggle button. Language is detected silently from:
 *   1. localStorage (returning users)
 *   2. navigator.language / navigator.languages
 *   3. document.cookie (set by middleware/header on first visit)
 * The detection happens BEFORE first render to avoid flash.
 */

export type Lang = 'ar' | 'en';

const STORAGE_KEY = 'nexus-lang';
const COOKIE_KEY = 'nexus-lang';

/**
 * Detect the user's preferred language.
 * Order of precedence:
 *   1. localStorage (user already visited)
 *   2. cookie (server-side detected on first load)
 *   3. navigator.languages / navigator.language
 *   4. default 'ar' (NEXUS is Arabic-first)
 */
export function detectLang(): Lang {
  // Guard for SSR
  if (typeof window === 'undefined') return 'ar';

  // 1. localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {}

  // 2. cookie
  try {
    const match = document.cookie.match(new RegExp(`${COOKIE_KEY}=([^;]+)`));
    if (match) {
      const val = match[1].trim();
      if (val === 'ar' || val === 'en') return val;
    }
  } catch {}

  // 3. navigator
  try {
    const langs = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    for (const l of langs) {
      const low = (l || '').toLowerCase();
      if (low.startsWith('ar')) return 'ar';
      if (low.startsWith('en')) return 'en';
    }
    // fall through to default
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('ar')) return 'ar';
    if (nav.startsWith('en')) return 'en';
  } catch {}

  // 4. default — Arabic-first product
  return 'ar';
}

/**
 * Persist the detected language so subsequent loads are instant.
 */
export function persistLang(lang: Lang): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  try {
    document.cookie = `${COOKIE_KEY}=${lang};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  } catch {}
}

export const isRTL = (lang: Lang): boolean => lang === 'ar';
