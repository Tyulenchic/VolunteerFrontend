import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { mapApiError } from '../utils/apiError';
import { DOSSIER_FORMATS, type DossierFormat } from '../utils/downloadFile';
import { Spinner } from './Spinner';

interface Props {
  onExport: (format: DossierFormat) => Promise<void>;
}

/** Кнопки скачивания данных в Excel / PDF / Word. Одновременно выполняется одна выгрузка. */
export function DossierExportButtons({ onExport }: Props) {
  const { notify } = useNotification();
  const [busy, setBusy] = useState<DossierFormat | null>(null);

  const run = async (format: DossierFormat) => {
    setBusy(format);
    try {
      await onExport(format);
    } catch (err) {
      notify(mapApiError(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {DOSSIER_FORMATS.map(f => (
        <button key={f.key} type="button" onClick={() => run(f.key)} disabled={busy !== null}
          className="px-4 py-2.5 border border-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-60 flex items-center gap-2">
          {busy === f.key ? <Spinner /> : <i className={`fas ${f.icon}`} />}{f.label}
        </button>
      ))}
    </div>
  );
}
