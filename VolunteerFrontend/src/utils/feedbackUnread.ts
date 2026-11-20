import { useCallback, useEffect, useState } from 'react';
import { feedbackApi } from '../api/feedback';

const CHANGED = 'feedback-unread-changed';
const POLL_MS = 60_000;

/** Страница обращений сообщает меню, что прочитанное изменилось, чтобы счётчик обновился сразу, не дожидаясь опроса. */
export const announceFeedbackRead = (): void => { window.dispatchEvent(new Event(CHANGED)); };

/**
 * Сколько обращений не прочитал именно этот администратор. Счётчик принадлежит учётной записи, поэтому его считает сервер
 * по токену; у другого администратора он свой. Без `enabled` (кабинет организатора) запросов нет.
 */
export function useFeedbackUnread(enabled: boolean): number {
  const [count, setCount] = useState(0);
  const refresh = useCallback(async () => {
    try { setCount((await feedbackApi.unreadCount()).unreadCount); }
    catch { /* счётчик необязателен: при сбое остаётся прежнее число */ }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener(CHANGED, refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(CHANGED, refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, refresh]);

  return enabled ? count : 0;
}
