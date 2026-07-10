'use client';

/**
 * NEXUS i18n — React Context Provider
 * Wraps the app and provides the detected language + translation function.
 * Detection runs synchronously on first render to avoid flash.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { detectLang, persistLang, isRTL, type Lang } from './detect';
import { t as translate } from './translations';

interface I18nContextValue {
  lang: Lang;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Detect synchronously on first render — prevents flash
  const [lang, setLang] = useState<Lang>(() => detectLang());

  // Persist + sync <html lang/dir> on mount and whenever lang changes
  useEffect(() => {
    persistLang(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    }
  }, [lang]);

  const t = useCallback((key: string) => translate(key, lang), [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      t,
      dir: isRTL(lang) ? 'rtl' : 'ltr',
      isRtl: isRTL(lang),
    }),
    [lang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access the i18n context.
 * Usage: const { t, lang, dir } = useI18n();
 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider (shouldn't happen)
    // but prevents a hard crash in edge cases.
    return {
      lang: 'ar',
      t: (key: string) => translate(key, 'ar'),
      dir: 'rtl',
      isRtl: true,
    };
  }
  return ctx;
}
