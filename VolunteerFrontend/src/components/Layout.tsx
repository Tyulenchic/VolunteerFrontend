import { useRef, type ReactNode } from 'react';
import { useAutoReveal } from '../hooks/useAutoReveal';
import { MobileTabBar } from './afisha/MobileTabBar';
import { SideArt } from './afisha/SideArt';
import { SiteFooter } from './afisha/SiteFooter';
import { SiteHeader } from './afisha/SiteHeader';
import { SkipToMain } from './afisha/SkipToMain';

/**
 * Shell of the public pages built on Tailwind utilities (news, organisations, about, profiles, ...).
 * Header, footer, tab bar, skip link, page background and side art are the same as in AfishaLayout. Page sections stay transparent
 * (no full-width bg-white bands), otherwise they would cover the side art.
 */
export function Layout({ children }: { children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  useAutoReveal(mainRef);
  return (
    <div className="vol-page relative flex min-h-dvh flex-col overflow-x-clip max-md:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]">
      <SideArt />
      <SkipToMain />
      <SiteHeader />
      <main ref={mainRef} id="main" tabIndex={-1} className="vol-enter relative z-10 flex-grow focus:outline-none">{children}</main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
