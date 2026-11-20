import { useRef, useState, type ChangeEvent } from 'react';
import { bookletAdminApi } from '../../../api/booklet';
import type { BookletImportLine, BookletImportReport } from '../../../types/booklet';
import { adminErrorMessage } from '../../../utils/adminErrors';
import { useNotification } from '../../../context/NotificationContext';
import { Modal } from '../../Modal';
import { Button } from '../../ui/Button';

const MAX_BYTES = 2_000_000;

const Lines = ({ title, items, tone }: { title: string; items: BookletImportLine[]; tone: string }) => items.length === 0 ? null : (
  <section className="space-y-1">
    <h3 className={`font-semibold ${tone}`}>{title} ({items.length})</h3>
    <ul className="max-h-40 overflow-y-auto text-xs space-y-0.5 pl-4 list-disc text-ink-700">
      {items.map(i => <li key={`${i.line}-${i.reason}`}>строка {i.line}: {i.reason}</li>)}
    </ul>
  </section>
);

/**
 * Загрузка книжек из CSV. Сначала «Проверить»: файл читается и приводится в порядок (номер в виде V-00…, фамилии с
 * заглавной буквы, год из даты), показывается отчёт: что будет добавлено, что исправлено и что не пройдёт, но ничего не
 * записывается. «Загрузить» записывает то же самое. Номера бумажных книжек остаются как в файле.
 */
export function ImportModal({ onClose, onLoaded }: { onClose: () => void; onLoaded: () => void }) {
  const { notify } = useNotification();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<BookletImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    setReport(null);
    setError(next && next.size > MAX_BYTES ? 'Файл больше 2 МБ: разбейте его на части.' : null);
    setFile(next && next.size <= MAX_BYTES ? next : null);
  };

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await bookletAdminApi.importCsv(file, dryRun);
      setReport(result);
      if (!dryRun) { notify(`Загружено книжек: ${result.created}`); onLoaded(); }
    } catch (e) {
      setError(adminErrorMessage(e, 'Не удалось прочитать файл.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={() => (busy ? undefined : onClose())} title="Загрузка книжек из CSV" maxWidth="max-w-3xl">
      <div className="space-y-4 text-sm">
        <p className="text-ink-500">Столбцы: Номер, Фамилия, Имя, Отчество, Год рождения, Дата выдачи, Почта аккаунта (последние три необязательны). Подходит файл из «Выгрузить CSV», Excel (сохранить как CSV) и таблица с английскими названиями.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={input} type="file" accept=".csv,text/csv,text/plain" onChange={pick} aria-label="Файл CSV" className="text-sm" />
          <Button variant="secondary" loading={busy} disabled={!file} onClick={() => void run(true)}>Проверить</Button>
          <Button loading={busy} disabled={!file || !report || !report.dryRun || report.created === 0} onClick={() => void run(false)}>Загрузить</Button>
        </div>
        {error && <div role="alert" className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg">{error}</div>}

        {report && (
          <div className="space-y-3" aria-live="polite">
            <p className="font-medium text-ink-900">
              {report.dryRun ? 'Проверка (ничего не записано)' : 'Загрузка выполнена'}: строк {report.lines}, {report.dryRun ? 'будет добавлено' : 'добавлено'} {report.created},
              пропущено {report.skipped.length}, конфликтов {report.conflicts.length}, ошибок {report.errors.length}.
            </p>
            {report.notes.map(n => <p key={n} className="text-warning-700">{n}</p>)}
            <Lines title="Ошибки: строки не загружены" items={report.errors} tone="text-danger-700" />
            <Lines title="Конфликты: строки не загружены" items={report.conflicts} tone="text-warning-700" />
            <Lines title="Пропущено" items={report.skipped} tone="text-ink-500" />
            {report.fixes.length > 0 && (
              <section className="space-y-1">
                <h3 className="font-semibold text-ink-900">Исправлено автоматически ({report.fixes.length})</h3>
                <ul className="max-h-40 overflow-y-auto text-xs space-y-0.5 pl-4 list-disc text-ink-700">
                  {report.fixes.map(f => <li key={`${f.line}-${f.field}-${f.to}`}>строка {f.line}, {f.field}: «{f.from}» → «{f.to}»</li>)}
                </ul>
              </section>
            )}
          </div>
        )}
        <div className="flex justify-end"><Button variant="secondary" onClick={onClose} disabled={busy}>Закрыть</Button></div>
      </div>
    </Modal>
  );
}
