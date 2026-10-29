import type { MouseEvent } from 'react';

const skipToMain = (ev: MouseEvent<HTMLAnchorElement>) => {
  ev.preventDefault(); // the app uses hash routing, so a plain #main link would change the route
  const m = document.getElementById('main');
  m?.focus({ preventScroll: true });
  m?.scrollIntoView();
};

/** «Перейти к содержимому»: видна только при фокусе с клавиатуры. Цель — элемент с id="main" в оболочке страницы. */
export function SkipToMain() {
  return (
    <a href="#main" onClick={skipToMain}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-vol-surface focus:px-4 focus:py-2.5 focus:text-[14px] focus:font-semibold focus:text-vol-accent focus:shadow-lg">
      Перейти к содержимому
    </a>
  );
}
