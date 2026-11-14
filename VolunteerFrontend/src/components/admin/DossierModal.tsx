import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { adminApi } from '../../api/admin';
import type { UserDossierDto } from '../../types/admin';
import { adminErrorMessage } from '../../utils/adminErrors';
import { REPORT_REASONS, REPORT_RESOLUTIONS, REPORT_STATUSES } from '../../utils/moderationLabels';
import type { ReportReason, ReportResolution, ReportStatus } from '../../api/moderation';
import { DossierExportButtons } from '../DossierExportButtons';
import { Modal } from '../Modal';
import { ErrorState } from '../ui/PageStates';
import { ListSkeleton } from '../ui/Skeleton';
import { STATUS_TONE, StatusBadge } from '../ui/StatusBadge';

const PARTICIPATION_LABEL: Record<string, string> = {
  Pending: 'На рассмотрении', Approved: 'Одобрена', Rejected: 'Отклонена', AttendanceConfirmed: 'Присутствовал', Withdrawn: 'Отозвана',
};

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

/** Досье пользователя на экране: учётная запись, анкета, сессии, заявки, жалобы. Просмотр записывается в журнал действий. */
export function DossierModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [dossier, setDossier] = useState<UserDossierDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    adminApi.getUserDossier(userId)
      .then(d => { if (alive) { setDossier(d); setError(null); } })
      .catch(err => { if (alive) setError(adminErrorMessage(err, 'Не удалось загрузить досье.')); });
    return () => { alive = false; };
  }, [userId, attempt]);

  const events = useMemo(() => new Map((dossier?.events ?? []).map(e => [e.id, e])), [dossier]);

  return (
    <Modal isOpen onClose={onClose} title="Досье пользователя" maxWidth="max-w-3xl">
      {error ? <ErrorState message={error} onRetry={() => setAttempt(a => a + 1)} />
        : !dossier ? <ListSkeleton />
        : (
          <div className="space-y-6 text-sm">
            <Section title="Учётная запись">
              <Grid rows={[
                ['E-mail', dossier.account.email],
                ['Роль', dossier.account.role],
                ['Состояние', dossier.account.isDeleted ? `Удалён (${dossier.account.deletionReason ?? '—'})` : dossier.account.isActive ? 'Активен' : 'Заблокирован'],
                ['Почта подтверждена', dossier.account.emailConfirmed ? 'Да' : 'Нет'],
                ['Согласие на обработку данных', dossier.account.consentGiven ? 'Дано' : 'Отозвано'],
                ['Регистрация', date(dossier.account.createdAt)],
                ['Последний вход', date(dossier.account.lastLoginAt)],
                ...(dossier.wordPress ? [['Логин WordPress', dossier.wordPress.userLogin ?? '—'] as [string, string]] : []),
              ]} />
            </Section>

            <Section title="Анкета">
              <Grid rows={[
                ['ФИО', [dossier.profile.lastName, dossier.profile.firstName, dossier.profile.middleName].filter(Boolean).join(' ') || '—'],
                ['Год рождения', dossier.profile.birthYear?.toString() ?? '—'],
                ['Город', dossier.profile.city ?? '—'],
                ['Номер книжки', dossier.profile.bookNumber ?? '—'],
                ['Телефон', dossier.profile.phoneNumber ?? '—'],
                ['Аватар', dossier.avatar ? dossier.avatar.status : 'нет'],
              ]} />
              {dossier.profile.bio && <p className="mt-2 text-ink-700 whitespace-pre-line break-words">{dossier.profile.bio}</p>}
            </Section>

            <Section title="Итоги">
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="neutral">Заявок: {dossier.summary.totalParticipations}</StatusBadge>
                <StatusBadge tone="pending">На рассмотрении: {dossier.summary.pending}</StatusBadge>
                <StatusBadge tone="success">Одобрено: {dossier.summary.approved}</StatusBadge>
                <StatusBadge tone="cancelled">Отклонено: {dossier.summary.rejected}</StatusBadge>
                <StatusBadge tone="completed">Присутствовал: {dossier.summary.attendanceConfirmed}</StatusBadge>
                {dossier.summary.organizedEvents > 0 && <StatusBadge tone="brand">Организовано: {dossier.summary.organizedEvents}</StatusBadge>}
              </div>
            </Section>

            <Section title={`Заявки на мероприятия (${dossier.participations.length})`}>
              {dossier.participations.length === 0 ? <p className="meta">Заявок нет.</p> : (
                <ul className="divide-y divide-line">
                  {dossier.participations.map(p => {
                    const ev = events.get(p.eventId);
                    return (
                      <li key={p.id} className="py-2 flex flex-wrap items-center gap-2">
                        <span className="flex-1 min-w-[12rem] text-ink-900">{ev?.title ?? 'Мероприятие удалено'}</span>
                        {ev && <span className="meta">{date(ev.startsAt)}</span>}
                        <StatusBadge tone={STATUS_TONE[p.status] ?? 'neutral'}>{PARTICIPATION_LABEL[p.status] ?? p.status}</StatusBadge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>

            {dossier.moderation && (
              <Section title={`Жалобы на пользователя (${dossier.moderation.reports.length}, открытых: ${dossier.moderation.openReports})`}>
                {dossier.moderation.reports.length === 0 ? <p className="meta">Жалоб нет.</p> : (
                  <ul className="divide-y divide-line">
                    {dossier.moderation.reports.map(r => (
                      <li key={r.id} className="py-2 flex flex-wrap items-center gap-2">
                        <span className="flex-1 text-ink-900">{REPORT_REASONS[r.reason as ReportReason] ?? r.reason}</span>
                        <span className="meta">{date(r.createdAt)}</span>
                        <StatusBadge tone={REPORT_STATUSES[r.status as ReportStatus]?.tone ?? 'neutral'}>
                          {r.resolution ? REPORT_RESOLUTIONS[r.resolution as ReportResolution]?.label ?? r.resolution : REPORT_STATUSES[r.status as ReportStatus]?.label ?? r.status}
                        </StatusBadge>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            <Section title={`Сеансы входа (последние ${dossier.sessions.length})`}>
              {dossier.sessions.length === 0 ? <p className="meta">Сеансов нет.</p> : (
                <ul className="divide-y divide-line">
                  {dossier.sessions.map((s, i) => (
                    <li key={`${s.createdAt}-${i}`} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-ink-900">{date(s.createdAt)}</span>
                      <span className="meta">IP: {s.ip ?? '—'}</span>
                      <span className="meta truncate max-w-full" title={s.userAgent ?? undefined}>{s.userAgent ?? '—'}</span>
                      <StatusBadge tone={s.revokedAt ? 'neutral' : 'success'}>{s.revokedAt ? 'Завершён' : 'Активен'}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <div className="border-t border-line pt-4">
              <p className="meta mb-2">Скачать досье файлом</p>
              <DossierExportButtons onExport={(f) => adminApi.exportUserDossier(userId, f)} />
            </div>
          </div>
        )}
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="card-title mb-2">{title}</h4>
      {children}
    </section>
  );
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-2 min-w-0">
          <dt className="text-ink-500 shrink-0">{k}:</dt>
          <dd className="text-ink-900 break-words min-w-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
