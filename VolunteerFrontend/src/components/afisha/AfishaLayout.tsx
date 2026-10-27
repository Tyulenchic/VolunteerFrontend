import type { MouseEvent, ReactNode } from 'react';
import { MobileTabBar } from './MobileTabBar';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

const skipToMain = (ev: MouseEvent<HTMLAnchorElement>) => {
  ev.preventDefault(); // the app uses hash routing, so a plain #main link would change the route
  const m = document.getElementById('main');
  m?.focus({ preventScroll: true });
  m?.scrollIntoView();
};

/** Page shell of the public pages in the afisha design: light backdrop, side art (from 1200px), header, footer and the phone tab bar. */
export function AfishaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="vol-page relative flex min-h-screen flex-col overflow-x-clip max-md:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]">
      <div className="vol-side-art vol-side-art-l" aria-hidden="true" />
      <div className="vol-side-art vol-side-art-r" aria-hidden="true" />
      <a href="#main" onClick={skipToMain}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-vol-surface focus:px-4 focus:py-2.5 focus:text-[14px] focus:font-semibold focus:text-vol-accent focus:shadow-lg">
        Перейти к содержимому
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="relative z-10 flex-1 focus:outline-none">{children}</main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
