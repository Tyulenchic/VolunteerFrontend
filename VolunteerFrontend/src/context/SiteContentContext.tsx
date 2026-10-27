import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { siteContentApi, type SiteContentItem } from '../api/siteContent';

interface SiteContentValue {
  /** Изменённые администратором тексты: ключ → значение. Отсутствующий ключ — действует исходный текст страницы. */
  overrides: ReadonlyMap<string, string>;
  /** Перечитывает тексты (после сохранения в админ-панели). */
  reload: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentValue>({ overrides: new Map(), reload: async () => {} });

/**
 * Загружает изменённые тексты один раз при запуске сайта. Если загрузка не удалась, страницы спокойно показывают исходные
 * тексты — отсутствие связи с сервером не должно ломать статические страницы.
 */
export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SiteContentItem[]>([]);

  const reload = useCallback(async () => {
    try { setItems(await siteContentApi.getAll()); }
    catch (e) { console.warn('[content] Не удалось загрузить тексты сайта, показаны исходные:', e); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const value = useMemo<SiteContentValue>(() => ({ overrides: new Map(items.map(i => [i.key, i.value])), reload }), [items, reload]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() { return useContext(SiteContentContext); }

/** Текст страницы: изменённый администратором либо исходный. */
export function useSiteText(key: string, fallback: string): string {
  return useContext(SiteContentContext).overrides.get(key) ?? fallback;
}

/**
 * Структурированный текст (списки вопросов, разделов, команда…): JSON в изменённом значении либо исходный.
 * Повреждённый JSON не ломает страницу — показывается исходный.
 */
export function useSiteJson<T>(key: string, fallback: T): T {
  const raw = useContext(SiteContentContext).overrides.get(key);
  return useMemo(() => {
    if (raw === undefined) return fallback;
    try {
      const parsed = JSON.parse(raw) as unknown;
      return (Array.isArray(fallback) && !Array.isArray(parsed)) ? fallback : (parsed as T);
    } catch {
      console.warn(`[content] Текст «${key}» повреждён (не JSON), показан исходный`);
      return fallback;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, key]);
}
