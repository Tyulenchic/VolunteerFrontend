import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface MenuAction {
  label: string;
  icon?: string;
  onSelect: () => void;
  danger?: boolean;
  hidden?: boolean;
}

/**
 * Kebab menu. Rendered in a portal with fixed coordinates so table/card scrollers (overflow-x-auto / hidden)
 * never clip it; it flips above the button near the bottom edge and stays inside the viewport.
 * Keyboard: Enter/Space/ArrowDown open, ArrowUp/Down move, Escape closes and returns focus.
 */
export function ActionMenu({ actions, label = 'Действия' }: { actions: MenuAction[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const visible = actions.filter(a => !a.hidden);

  const place = useCallback(() => {
    const b = btn.current?.getBoundingClientRect();
    const m = menu.current;
    if (!b || !m) return;
    const w = m.offsetWidth, h = m.offsetHeight, gap = 4, pad = 8;
    const left = Math.min(Math.max(pad, b.right - w), window.innerWidth - w - pad);
    const below = b.bottom + gap;
    const top = below + h > window.innerHeight - pad ? Math.max(pad, b.top - gap - h) : below;
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place, visible.length]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !btn.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); btn.current?.focus(); }
      if (e.key === 'Tab') close();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []);
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true); // any scroller moving makes fixed coordinates stale
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  // Move focus into the menu once it is positioned.
  useEffect(() => { if (open && pos) menu.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus(); }, [open, pos]);

  if (visible.length === 0) return null;
  return (
    <>
      <button ref={btn} type="button" className="icon-btn" aria-label={label} aria-haspopup="menu" aria-expanded={open}
        onClick={() => { setPos(null); setOpen(o => !o); }}>
        <i className="fas fa-ellipsis-vertical" />
      </button>
      {open && createPortal(
        <div ref={menu} role="menu" aria-label={label}
          style={{ position: 'fixed', top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
          className="admin-modal glass z-[55] min-w-[11rem] rounded-card border border-line-strong shadow-pop p-1">
          {visible.map(a => (
            <button key={a.label} role="menuitem" type="button"
              onClick={() => { setOpen(false); a.onSelect(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-left text-[13px] ${a.danger ? 'text-danger-700 hover:bg-danger-50' : 'text-ink-700 hover:bg-surface-3 hover:text-ink-900'}`}>
              {a.icon && <i className={`fas ${a.icon} w-4 text-center text-xs`} />}{a.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
