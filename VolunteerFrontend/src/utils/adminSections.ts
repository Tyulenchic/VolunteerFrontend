/**
 * Разделы админ-панели, которые системный администратор может открыть администратору контента галочками.
 * Ключи совпадают с AdminSection на сервере. Системные страницы (состояние системы, журнал, база данных, импорт)
 * ни к какому разделу не относятся: их видит только системный администратор.
 */
export const ADMIN_SECTIONS = [
  { key: 'dashboard', label: 'Дашборд', hint: 'Сводка и последние события' },
  { key: 'analytics', label: 'Аналитика', hint: 'Графики и статистика' },
  { key: 'events', label: 'Мероприятия', hint: 'Создание и редактирование, свои категории и теги' },
  { key: 'participations', label: 'Заявки', hint: 'Заявки волонтёров на мероприятия' },
  { key: 'users', label: 'Пользователи', hint: 'Список, досье, блокировка' },
  { key: 'organizations', label: 'Организации', hint: 'Создание, редактирование, публикации организаций' },
  { key: 'feedback', label: 'Обращения', hint: 'Сообщения «Написать нам» и ответы на них' },
  { key: 'news', label: 'Новости', hint: 'Создание и публикация новостей' },
  { key: 'videos', label: 'Видеоотчёты', hint: 'Ссылки на видео' },
  { key: 'moderation', label: 'Модерация', hint: 'Аватары, жалобы, запрещённые слова' },
  { key: 'content', label: 'Тексты сайта', hint: 'Редактируемые тексты страниц' },
  { key: 'booklets', label: 'Книжки', hint: 'Заявки на добровольческую книжку, номера, печать PDF' },
] as const;

export type AdminSectionKey = (typeof ADMIN_SECTIONS)[number]['key'];

export const ALL_SECTION_KEYS: AdminSectionKey[] = ADMIN_SECTIONS.map(s => s.key);

/**
 * Можно ли администратору открыть раздел. `sections === null` (или поле не пришло) — системный администратор,
 * ограничений нет; список — администратор контента, ему доступно только отмеченное.
 */
export const canUseSection = (sections: readonly string[] | null | undefined, key: AdminSectionKey): boolean =>
  sections == null || sections.includes(key);
