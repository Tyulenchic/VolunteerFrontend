import { useLayoutEffect, type RefObject } from 'react';

/**
 * Появление блоков публичных страниц при прокрутке — без обёрток в каждой странице.
 * Внутри main находит заголовки и блоки секций и карточки сеток, прячет те, что ещё не показаны (data-reveal="hidden"),
 * и проявляет их, когда они входят в область просмотра (data-reveal="shown"); элементы, вошедшие вместе, появляются по очереди.
 * Подгруженный позже контент (ответы API, смена страницы) подхватывается через MutationObserver.
 *
 * Атрибут, а не класс: React не трогает чужие data-атрибуты при перерисовке. Стили — [data-reveal] в index.css.
 * Без IntersectionObserver (старые браузеры, jsdom) ничего не прячется.
 */
const CANDIDATES = [
  // блоки секций: и <section><div class="wrap">…, и <section class="wrap">…; сетки обрабатываются по карточкам
  ':is(section > .wrap, section.wrap) > :not(.grid):not(:has(.grid))',
  // заголовки и вводный текст внутри обёрток, где лежат сетки
  ':is(section > .wrap, section.wrap) > * > :is(h1, h2, h3, p, .vol-lead)',
  // карточки сеток
  '.grid > *',
].join(',');

// декор, закреплённые панели, диалоги и блоки с ручной анимацией (компонент Reveal) не трогаем
const SKIP = '.reveal, .sticky, .absolute, .fixed, [aria-hidden="true"], [role="dialog"], [aria-modal="true"], [data-no-reveal]';

const STAGGER_MS = 70;
const MAX_STAGGER_MS = 420;

export function useAutoReveal(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(entries => {
      let i = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.style.setProperty('--reveal-delay', `${Math.min(i++ * STAGGER_MS, MAX_STAGGER_MS)}ms`);
        el.dataset.reveal = 'shown';
        io.unobserve(el);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

    // что наблюдает именно этот запуск: при повторном запуске эффекта (StrictMode, перемонтирование) уже скрытые,
    // но ещё не показанные блоки подхватываются заново, иначе они остались бы невидимыми навсегда
    const observed = new WeakSet<HTMLElement>();
    const scan = () => {
      let found: HTMLElement[];
      try {
        found = Array.from(root.querySelectorAll<HTMLElement>(CANDIDATES))
          .filter(el => el.dataset.reveal !== 'shown' && !observed.has(el) && !el.closest(SKIP));
      } catch {
        return; // браузер без :has() — оставляем страницу без анимации
      }
      const set = new Set(found);
      for (const el of found) {
        // вложенные кандидаты не анимируем второй раз: достаточно внешнего блока
        let p = el.parentElement;
        while (p && p !== root && !set.has(p) && !p.dataset.reveal) p = p.parentElement;
        if (p && p !== root) continue;
        el.dataset.reveal = 'hidden';
        observed.add(el);
        io.observe(el);
      }
    };

    scan();
    // колбэк MutationObserver выполняется до отрисовки, поэтому новые блоки не «мигают» перед появлением
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => { mo.disconnect(); io.disconnect(); };
  }, [rootRef]);
}
