import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal } from '../Modal';
import { Button } from './Button';

interface ConfirmOptions { title?: string; message: string; confirmLabel?: string; danger?: boolean; }
type ConfirmFn = (opts: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

/** Promise-based replacement for window.confirm: `if (await confirm('…')) { … }` */
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => new Promise<boolean>((resolve) => {
    resolver.current = resolve;
    setOpts(typeof o === 'string' ? { message: o } : o);
  }), []);

  const settle = (v: boolean) => { resolver.current?.(v); resolver.current = null; setOpts(null); };
  const danger = opts?.danger !== false;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal isOpen={!!opts} onClose={() => settle(false)} title={opts?.title ?? 'Подтвердите действие'} maxWidth="max-w-md">
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${danger ? 'bg-danger-50 text-danger-700' : 'bg-brand-50 text-brand-700'}`}>
              <i className="fas fa-triangle-exclamation" />
            </div>
            <p className="text-ink-700 text-sm leading-relaxed pt-2">{opts?.message}</p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="secondary" onClick={() => settle(false)}>Отмена</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => settle(true)}>{opts?.confirmLabel ?? 'Подтвердить'}</Button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
