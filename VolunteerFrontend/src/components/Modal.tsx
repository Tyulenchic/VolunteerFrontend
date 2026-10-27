import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialog } from '../hooks/useDialog';
import { useAdminScope } from './ui/AdminScope';

interface Props { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string; }

let openModals = 0;

/**
 * Единое модальное окно сайта. Поведение одно для всех: фокус внутрь, Tab по кругу, Esc закрывает верхнее окно,
 * фокус возвращается на кнопку, открывшую окно. Внешний вид один на раздел: светлое окно на публичных страницах
 * и тёмное в панелях администратора и организатора (там весь интерфейс тёмный).
 */
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: Props) {
  const admin = useAdminScope();
  const titleId = useId();

  // Scroll lock is reference-counted: closing one modal (or a mounted-but-closed one) must not unlock
  // the page while another modal is still open.
  useEffect(() => {
    if (!isOpen) return;
    openModals++;
    document.body.classList.add('modal-open');
    return () => {
      openModals--;
      if (openModals <= 0) { openModals = 0; document.body.classList.remove('modal-open'); }
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return createPortal(
    <ModalPanel admin={admin} title={title} titleId={titleId} maxWidth={maxWidth} onClose={onClose}>{children}</ModalPanel>,
    document.body,
  );
}

// Первым фокус получает поле формы (если оно есть), иначе кнопка закрытия.
const FIRST_FIELD = 'input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]),select,textarea';

function ModalPanel({ admin, title, titleId, maxWidth, onClose, children }: {
  admin: boolean; title: string; titleId: string; maxWidth: string; onClose: () => void; children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(panelRef, onClose, FIRST_FIELD, { lockScroll: false });

  if (admin) {
    return (
      <div className="admin-modal fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-[3px] anim-backdrop"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
          className={`bg-surface-2 w-full ${maxWidth} max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-card border border-line-strong shadow-pop anim-pop outline-none`}>
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
            <h3 id={titleId} className="section-title leading-tight">{title}</h3>
            <button type="button" onClick={onClose} className="icon-btn -mr-2 -mt-1 shrink-0" aria-label="Закрыть">
              <i className="fas fa-xmark" aria-hidden />
            </button>
          </div>
          <div className="p-6 overflow-y-auto scroll-soft">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="vol-head fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,27,51,.45)] backdrop-blur-sm vol-fade"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={`bg-white text-gray-900 border border-gray-100 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto anim-fade outline-none`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-white px-6 py-4 border-b border-gray-100 rounded-t-2xl">
          <h3 id={titleId} className="font-heading text-lg font-bold leading-tight text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Закрыть"
            className="vol-tap relative -mr-2 -mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900">
            <i className="fas fa-xmark" aria-hidden />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
