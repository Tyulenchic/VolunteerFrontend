import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type NType = "success" | "error" | "info";
interface Notif { id: number; msg: string; type: NType; }
interface NCtx { notify: (msg: string, type?: NType) => void; }
const Ctx = createContext<NCtx | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notif[]>([]);
  const counter = useRef(0);
  const notify = useCallback((msg: string, type: NType = "success") => {
    const id = ++counter.current;
    setItems(p => [...p, { id, msg, type }]);
    setTimeout(() => setItems(p => p.filter(n => n.id !== id)), 3500);
  }, []);
  const icon = (t: NType) => t === "success" ? "fa-check-circle" : t === "error" ? "fa-exclamation-circle" : "fa-info-circle";
  const bg = (t: NType) => t === "success" ? "bg-green-500" : t === "error" ? "bg-red-500" : "bg-blue-500";
  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {items.map(n => (
          <div key={n.id} className={"pointer-events-auto px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 anim-slide " + bg(n.type)}>
            <i className={"fas " + icon(n.type)} />
            <span>{n.msg}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useNotification() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotification outside provider");
  return ctx;
}
