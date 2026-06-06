import { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';

const KEY = 'vpmt_cookies';
export function CookieBanner() {
  const [vis, setVis] = useState(false);
  const { notify } = useNotification();
  useEffect(() => { if (!localStorage.getItem(KEY)) setTimeout(() => setVis(true), 2000); }, []);
  if (!vis) return null;
  const accept = () => { localStorage.setItem(KEY, 'y'); setVis(false); notify('Cookie приняты! 🍪'); };
  const decline = () => { localStorage.setItem(KEY, 'n'); setVis(false); notify('Cookie отклонены', 'info'); };
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 sm:p-5 z-40 shadow-2xl">
      <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-300 text-center sm:text-left">
          Мы используем файлы cookie для улучшения работы сайта.{' '}
          <span className="text-blue-400 underline cursor-pointer">Политика конфиденциальности</span>.
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button onClick={decline} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition">Отклонить</button>
          <button onClick={accept} className="px-5 py-2 text-sm font-medium bg-primary rounded-lg hover:bg-primary-dark transition">Принять</button>
        </div>
      </div>
    </div>
  );
}
