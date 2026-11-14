import type { Tone } from '../components/ui/StatusBadge';
import type { ReportReason, ReportResolution, ReportStatus, TermMatchMode } from '../api/moderation';

export const REPORT_REASONS: Record<ReportReason, string> = {
  InappropriateName: 'Недопустимое имя',
  InappropriateAvatar: 'Недопустимое фото',
  InappropriateBio: 'Недопустимый текст «О себе»',
  Impersonation: 'Выдаёт себя за другого',
  Other: 'Другое',
};

export const REPORT_STATUSES: Record<ReportStatus, { label: string; tone: Tone }> = {
  Open: { label: 'Открыта', tone: 'pending' },
  Resolved: { label: 'Приняты меры', tone: 'success' },
  Dismissed: { label: 'Отклонена', tone: 'neutral' },
};

export const REPORT_RESOLUTIONS: Record<ReportResolution, { label: string; hint: string; icon: string; danger: boolean }> = {
  Dismiss: { label: 'Без мер', hint: 'Нарушения нет, жалоба закрывается.', icon: 'fa-check', danger: false },
  ResetProfileText: { label: 'Очистить имя и «О себе»', hint: 'Пользователь получит письмо и сможет заполнить поля заново.', icon: 'fa-eraser', danger: true },
  RemoveAvatar: { label: 'Удалить фото', hint: 'Аватар удаляется, пользователь получит письмо.', icon: 'fa-image', danger: true },
  BlockUser: { label: 'Заблокировать', hint: 'Пользователь не сможет войти, пока его не разблокируют.', icon: 'fa-user-lock', danger: true },
};

export const TERM_MODES: Record<TermMatchMode, { label: string; hint: string }> = {
  WholeWord: { label: 'Слово целиком', hint: 'Срабатывает, только если выражение стоит отдельным словом.' },
  Substring: { label: 'Часть слова', hint: 'Срабатывает в любом месте текста, в том числе внутри других слов.' },
};
