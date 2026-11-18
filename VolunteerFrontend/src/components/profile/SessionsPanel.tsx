import { useCallback, useEffect, useState } from 'react';
import { authApi } from '../../api/auth';
import { useNotification } from '../../context/NotificationContext';
import { useApiError } from '../../hooks/useApiError';
import { deviceTitle, describeDevice } from '../../utils/device';
import type { SessionDto } from '../../types/auth';
import { Button } from '../ui/Button';
import { ConfirmProvider, useConfirm } from '../ui/ConfirmDialog';
import { Spinner } from '../Spinner';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * «Устройства и сеансы»: где аккаунт открыт сейчас. Сеанс на другом устройстве можно завершить — там сразу
 * произойдёт выход из аккаунта. Текущий сеанс завершить здесь нельзя: для него есть кнопка «Выйти».
 */
function SessionsList() {
  const { notify } = useNotification();
  const confirm = useConfirm();
  const { error, capture, setError } = useApiError();
  const [sessions, setSessions] = useState<SessionDto[] | null>(null);
  const [busy, setBusy] = useState<string | 'all' | null>(null);

  const load = useCallback(async () => {
    try {
      setSessions(await authApi.listSessions());
    } catch (err) { capture(err); setSessions(prev => prev ?? []); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void load(); }, [load]);

  const others = (sessions ?? []).filter(s => !s.current);

  const endOne = async (s: SessionDto) => {
    if (s.current || busy) return;
    const ok = await confirm({
      title: 'Завершить сеанс?',
      message: `На устройстве «${deviceTitle(s.userAgent)}» будет выполнен выход из аккаунта.`,
      confirmLabel: 'Завершить',
    });
    if (!ok) return;
    setError(undefined); setBusy(s.id);
    try {
      await authApi.endSession(s.id);
      notify('Сеанс завершён', 'info');
    } catch (err) { capture(err); }
    finally { setBusy(null); await load(); }
  };

  const endAll = async () => {
    if (busy || others.length === 0) return;
    const ok = await confirm({
      title: 'Завершить остальные сеансы?',
      message: `Выход из аккаунта будет выполнен на других устройствах (${others.length}). Этот сеанс останется.`,
      confirmLabel: 'Завершить все',
    });
    if (!ok) return;
    setError(undefined); setBusy('all');
    try {
      const count = await authApi.endOtherSessions();
      notify(count > 0 ? `Завершено сеансов: ${count}` : 'Других сеансов уже нет', 'info');
    } catch (err) { capture(err); }
    finally { setBusy(null); await load(); }
  };

  return (
    <section aria-labelledby="sessions-title" className="mt-8 border-t border-vol-line pt-6">
      <h2 id="sessions-title" className="vol-h3 mb-2">Устройства и сеансы</h2>
      <p className="vol-text-sm mb-4">
        Здесь видно, где вы вошли в аккаунт и не вышли. Если устройство незнакомое или вы потеряли телефон — завершите его сеанс:
        на нём сразу произойдёт выход из аккаунта.
      </p>

      {error && <div role="alert" className="mb-4 rounded-control border border-red-200 bg-red-50 p-3 text-ctrl text-vol-warn">{error}</div>}

      {sessions === null ? (
        <div className="py-6 flex justify-center"><Spinner /></div>
      ) : (
        <>
          <ul className="space-y-3" aria-label="Сеансы входа">
            {sessions.map(s => {
              const { mobile } = describeDevice(s.userAgent);
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-vol-line p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <i className={`fas ${mobile ? 'fa-mobile-screen' : 'fa-desktop'} mt-1 text-vol-muted`} aria-hidden />
                    <div className="min-w-0">
                      <p className="font-semibold flex flex-wrap items-center gap-2">
                        {deviceTitle(s.userAgent)}
                        {s.current && <span className="inline-flex items-center rounded-full bg-vol-green-soft px-2.5 py-0.5 text-meta font-semibold text-vol-green">Это устройство</span>}
                      </p>
                      <p className="vol-meta">
                        {s.ipAddress ? `IP ${s.ipAddress} · ` : ''}вход {formatDateTime(s.startedAt)} · активность {formatDateTime(s.lastActiveAt)}
                      </p>
                    </div>
                  </div>
                  {s.current ? (
                    <span className="vol-meta">Текущий сеанс завершить нельзя. Используйте «Выйти».</span>
                  ) : (
                    <Button variant="secondary" onClick={() => endOne(s)} loading={busy === s.id} disabled={busy !== null}
                      aria-label={`Завершить сеанс: ${deviceTitle(s.userAgent)}`}>
                      <i className="fas fa-right-from-bracket" aria-hidden />Завершить
                    </Button>
                  )}
                </li>
              );
            })}
            {sessions.length === 0 && !error && <li className="vol-text-sm">Активных сеансов не найдено.</li>}
          </ul>

          <div className="mt-4">
            <Button variant="danger" onClick={endAll} loading={busy === 'all'} disabled={busy !== null || others.length === 0}>
              <i className="fas fa-right-from-bracket" aria-hidden />Завершить все остальные сеансы
            </Button>
            {others.length === 0 && sessions.length > 0 && <p className="vol-meta mt-2">Других устройств, где вы вошли, нет.</p>}
          </div>
        </>
      )}
    </section>
  );
}

export function SessionsPanel() {
  return <ConfirmProvider><SessionsList /></ConfirmProvider>;
}
