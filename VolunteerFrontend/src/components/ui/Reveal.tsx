import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

/**
 * Лёгкое появление блока при прокрутке: элемент поднимается на несколько пикселей и проявляется,
 * когда попадает в область просмотра. Срабатывает один раз. delay (мс) — для поочерёдного появления карточек.
 *
 * Без IntersectionObserver (старые браузеры, тесты в jsdom) и при «уменьшить движение» блок виден сразу —
 * содержимое никогда не остаётся скрытым. Стили: .reveal / .is-visible в index.css.
 */
interface Props {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}

export function Reveal({ children, as: Tag = 'div', delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined;
  return (
    <Tag ref={ref} style={style} className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
