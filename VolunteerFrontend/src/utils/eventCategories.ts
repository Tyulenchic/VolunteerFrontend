import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { apiClient } from '../api/client';
import { CATEGORY_LABELS, type EventCategory } from '../types/event';

/** Категория мероприятия: встроенная или добавленная администратором (value — её код, label — название). */
export interface EventCategoryOption {
  value: string;
  label: string;
  builtIn: boolean;
}

let options: EventCategoryOption[] = [];
let loaded = false;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

const publish = (next: EventCategoryOption[]) => {
  options = next;
  loaded = true;
  listeners.forEach(l => l());
};

/** Загружает список категорий один раз; повторные вызовы ждут тот же запрос. */
export function loadEventCategories(force = false): Promise<void> {
  if (loaded && !force) return Promise.resolve();
  if (!pending) {
    pending = apiClient.get<EventCategoryOption[]>('/api/events/categories')
      .then(r => publish(r.data))
      .catch(() => { /* остаются встроенные названия */ })
      .finally(() => { pending = null; });
  }
  return pending;
}

/** Название категории по коду: встроенное, добавленное администратором или сам код, пока список не загружен. */
export function categoryLabel(code: string | null | undefined): string {
  if (!code) return '';
  return CATEGORY_LABELS[code as EventCategory] ?? options.find(o => o.value === code)?.label ?? code;
}

/** Только для тестов. */
export function resetEventCategories(next: EventCategoryOption[] | null = null) {
  options = next ?? [];
  loaded = next !== null;
  pending = null;
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => options;

export function useEventCategories() {
  const list = useSyncExternalStore(subscribe, snapshot);
  useEffect(() => { void loadEventCategories(); }, []);
  const refresh = useCallback(() => loadEventCategories(true), []);
  return { list, labelOf: categoryLabel, refresh };
}

export const eventCategoriesApi = {
  create: async (name: string): Promise<EventCategoryOption> => {
    const { data } = await apiClient.post<EventCategoryOption>('/api/events/categories', { name });
    await loadEventCategories(true);
    return data;
  },
  remove: async (code: string): Promise<void> => {
    await apiClient.delete(`/api/events/categories/${code}`);
    await loadEventCategories(true);
  },
};
