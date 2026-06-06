import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string; }

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: Props) {
  useEffect(() => {
    document.body.classList.toggle('modal-open', isOpen);
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal aria-labelledby="modal-title">
      <div className={`bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto anim-fade`}>
        <div className="sticky top-0 bg-gray-900 z-10 px-6 py-4 border-b border-gray-800 flex justify-between items-center rounded-t-2xl">
          <h3 id="modal-title" className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-gray-800" aria-label="Закрыть">
            <i className="fas fa-times text-lg" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
