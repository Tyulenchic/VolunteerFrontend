import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Открытые окна друг над другом (подтверждение поверх формы): Esc и Tab обрабатывает только верхнее.
const stack: symbol[] = [];

interface Options {
  /** Запретить прокрутку страницы под окном. Выключается там, где её блокирует сам компонент (Modal). */
  lockScroll?: boolean;
}

/**
 * Поведение диалога для контейнера, который монтируется только пока окно открыто: фокус уходит внутрь, Tab ходит
 * по кругу, Esc закрывает (только верхнее окно), страница под окном не прокручивается, фокус возвращается на элемент,
 * открывший окно. `initial` — необязательный селектор элемента, который получает фокус первым.
 */
export function useDialog(ref: RefObject<HTMLElement | null>, onClose: () => void, initial?: string, { lockScroll = true }: Options = {}) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const token = Symbol('dialog');
    stack.push(token);
    const opener = document.activeElement as HTMLElement | null;
    const list = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(e => e.getClientRects().length);
    (((initial && root.querySelector<HTMLElement>(initial)) || list()[0]) ?? root).focus({ preventScroll: true });

    const onKey = (ev: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return;
      if (ev.key === 'Escape') { ev.preventDefault(); close.current(); return; }
      if (ev.key !== 'Tab') return;
      const f = list();
      if (!f.length) { ev.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1], cur = document.activeElement;
      if (!root.contains(cur)) { ev.preventDefault(); first.focus(); }
      else if (ev.shiftKey && cur === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && cur === last) { ev.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      const i = stack.indexOf(token);
      if (i >= 0) stack.splice(i, 1);
      if (lockScroll) document.body.style.overflow = prevOverflow;
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount; onClose is read through a ref
  }, []);
}
