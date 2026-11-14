import type { ImportIssueDto } from '../../api/admin';

const MAX_ISSUES_SHOWN = 300;

/** Таблица пропущенных записей или предупреждений импорта. lineLabel — как называется номер записи (строка файла или ID в таблице). */
export function ImportIssueTable({ title, items, lineLabel = 'Запись' }: { title: string; items: ImportIssueDto[]; lineLabel?: string }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_ISSUES_SHOWN);
  return (
    <div>
      <h4 className="card-title mb-2">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 border-b border-line">
              <th className="py-2 pr-4 font-medium">{lineLabel}</th>
              <th className="py-2 pr-4 font-medium">ID WordPress</th>
              <th className="py-2 font-medium">Причина</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((i, n) => (
              <tr key={`${i.line}-${n}`}>
                <td className="py-2 pr-4 tabular-nums">{i.line}</td>
                <td className="py-2 pr-4 tabular-nums">{i.wpId ?? '—'}</td>
                <td className="py-2">{i.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length > shown.length && <p className="meta mt-2">Показаны первые {shown.length} из {items.length}.</p>}
    </div>
  );
}
