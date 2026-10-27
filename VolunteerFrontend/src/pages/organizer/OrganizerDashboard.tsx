import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizerApi } from '../../api/organizer';
import { CroppedImage } from '../../components/ImageCropper';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/PageStates';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import type { OrganizerSummary } from '../../types/organization';

/** Обзор кабинета организатора: что ждёт решения и какими организациями он управляет. */
export function OrganizerDashboard() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState<OrganizerSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    organizerApi.summary().then(setSummary).catch(() => setError('Не удалось загрузить сводку.'));
  };
  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!summary) return <LoadingState />;

  const tiles = [
    { to: '/organizer/applications', icon: 'fa-user-plus', label: 'Заявки в организацию', value: summary.pendingMembershipApplications, hint: 'ждут вашего решения' },
    { to: '/organizer/participations', icon: 'fa-clipboard-list', label: 'Заявки на мероприятия', value: summary.pendingParticipations, hint: 'ждут вашего решения' },
    { to: '/organizer', icon: 'fa-bell', label: 'Непрочитанные уведомления', value: summary.unreadNotifications, hint: 'колокольчик вверху справа' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Здравствуйте, ${user?.firstName || 'организатор'}!`}
        description={isAdmin ? 'Вы видите все организации платформы.' : 'Здесь заявки волонтёров, мероприятия и публикации ваших организаций.'}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        {tiles.map(t => (
          <Link key={t.label} to={t.to} className="no-underline">
            <Card className="p-5 h-full hover:border-brand-500 transition">
              <div className="flex items-center gap-3 mb-3 text-ink-500"><i className={`fas ${t.icon}`} aria-hidden /><span className="text-[13px] font-medium">{t.label}</span></div>
              <p className={`text-3xl font-bold ${t.value > 0 && t.label !== 'Непрочитанные уведомления' ? 'text-warning-700' : 'text-ink-900'}`}>{t.value}</p>
              <p className="meta mt-1">{t.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader title="Мои организации" />
        {summary.organizations.length === 0 ? (
          <EmptyState icon="fa-building-columns" title="Вы пока не состоите ни в одной организации как организатор"
            hint="Администратор назначает организаторов на странице «Организации». После назначения здесь появятся заявки, мероприятия и публикации." />
        ) : (
          <ul className="divide-y divide-line">
            {summary.organizations.map(o => (
              <li key={o.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border border-line bg-surface-3 flex items-center justify-center">
                  {o.logoThumbnailUrl ? <CroppedImage src={o.logoThumbnailUrl} crop={o.logoCrop} aspect={1} className="w-full !rounded-none" /> : <i className="fas fa-hands-helping text-ink-400" aria-hidden />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900 truncate">{o.name}</p>
                  <p className="meta">Страница организации видна всем посетителям</p>
                </div>
                <Link to={`/organizations/${o.id}`} className="btn btn-secondary btn-sm no-underline">Открыть</Link>
                <Link to={`/organizer/organizations/${o.id}`} className="btn btn-primary btn-sm no-underline">Управлять</Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="card-title mb-3">С чего начать</h3>
        <ol className="list-decimal pl-5 space-y-1.5 text-[14px] text-ink-500">
          <li>Заполните страницу организации: описание, контакты, логотип и обложку («Моя организация»).</li>
          <li>Создайте мероприятие — оно появится и на странице организации, и в общем списке мероприятий.</li>
          <li>Публикуйте фото и истории в «Публикациях» — их увидят все, кто откроет страницу организации.</li>
          <li>Принимайте заявки волонтёров: приняв заявку, вы добавляете человека в организацию, и она появляется в его профиле.</li>
        </ol>
      </Card>
    </div>
  );
}
