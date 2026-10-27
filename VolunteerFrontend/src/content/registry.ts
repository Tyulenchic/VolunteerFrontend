import {
  ABOUT_TEAM_DEFAULT, ABOUT_TEXT_DEFAULT as T, ABOUT_VALUES_DEFAULT, FAQ_DEFAULT, PRIVACY_DEFAULT, RULES_DEFAULT,
} from './defaults';

/**
 * Описание редактируемых текстов: что и как показывать администратору в разделе «Тексты сайта».
 * Тип поля задаёт и редактор, и способ хранения значения на сервере:
 *  text/textarea — обычная строка;  lines — JSON-массив строк;  list — JSON-массив объектов с вложенными полями.
 * Исходные значения (default) показываются на страницах, пока администратор ничего не менял.
 */
export type FieldType = 'text' | 'textarea' | 'lines' | 'list' | 'profile';

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  /** Для list: поля каждого элемента. */
  fields?: FieldSchema[];
  /** Для list: как называть элемент («вопрос», «раздел»…). */
  itemLabel?: string;
}

export interface ContentEntry extends FieldSchema {
  default: unknown;
}

export interface ContentGroup {
  id: string;
  title: string;
  icon: string;
  /** Адрес страницы на сайте — для кнопки «Открыть страницу». */
  path: string;
  entries: ContentEntry[];
}

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: 'faq', title: 'Вопросы и ответы (FAQ)', icon: 'fa-circle-question', path: '/faq',
    entries: [{
      key: 'faq.categories', label: 'Разделы вопросов', type: 'list', itemLabel: 'раздел', default: FAQ_DEFAULT,
      hint: 'Добавляйте разделы и вопросы, меняйте порядок кнопками. Иконка — название значка Font Awesome (например, fa-rocket), цвет — класс Tailwind (text-blue-500).',
      fields: [
        { key: 'cat', label: 'Название раздела', type: 'text' },
        { key: 'icon', label: 'Иконка', type: 'text' },
        { key: 'color', label: 'Цвет иконки', type: 'text' },
        { key: 'items', label: 'Вопросы', type: 'list', itemLabel: 'вопрос', fields: [
          { key: 'q', label: 'Вопрос', type: 'text' },
          { key: 'a', label: 'Ответ', type: 'textarea' },
        ] },
      ],
    }],
  },
  {
    id: 'about', title: 'О нас', icon: 'fa-hand-holding-heart', path: '/about',
    entries: [
      { key: 'about.hero.lead', label: 'Вступление (вверху страницы)', type: 'textarea', default: T.heroLead, hint: 'Переносы строк сохраняются.' },
      { key: 'about.hero.mission', label: 'Миссия', type: 'textarea', default: T.heroMission },
      { key: 'about.platform.p1', label: 'О платформе — абзац 1', type: 'textarea', default: T.platform1 },
      { key: 'about.platform.p2', label: 'О платформе — абзац 2', type: 'textarea', default: T.platform2 },
      { key: 'about.platform.p3', label: 'О платформе — абзац 3', type: 'textarea', default: T.platform3 },
      { key: 'about.efforts.title', label: 'Заголовок списка «Наши усилия»', type: 'text', default: T.effortsTitle },
      { key: 'about.efforts', label: 'Наши усилия (пункты)', type: 'lines', default: T.efforts, hint: 'Каждый пункт — с новой строки.' },
      { key: 'about.tagline', label: 'Заключительная фраза', type: 'text', default: T.tagline },
      {
        key: 'about.values', label: 'Наши ценности', type: 'list', itemLabel: 'ценность', default: ABOUT_VALUES_DEFAULT,
        hint: 'Иконка — Font Awesome (fa-heart); цвет — классы Tailwind (text-red-500 bg-red-50).',
        fields: [
          { key: 'icon', label: 'Иконка', type: 'text' },
          { key: 'title', label: 'Название', type: 'text' },
          { key: 'desc', label: 'Описание', type: 'textarea' },
          { key: 'color', label: 'Цвета', type: 'text' },
        ],
      },
      { key: 'about.contacts.email', label: 'Контакты — электронная почта', type: 'text', default: T.email },
      { key: 'about.contacts.phone', label: 'Контакты — телефон', type: 'text', default: T.phone },
      { key: 'about.contacts.hours', label: 'Контакты — часы работы', type: 'text', default: T.hours },
      { key: 'about.contacts.city', label: 'Контакты — город', type: 'text', default: T.city },
      { key: 'about.contacts.office', label: 'Контакты — учреждение', type: 'text', default: T.office },
    ],
  },
  {
    id: 'founders', title: 'Основатели', icon: 'fa-people-group', path: '/about',
    entries: [
      { key: 'about.team.title', label: 'Заголовок блока «Основатели»', type: 'text', default: T.teamTitle },
      { key: 'about.team.subtitle', label: 'Подзаголовок блока «Основатели»', type: 'text', default: T.teamSubtitle },
      {
        key: 'about.team', label: 'Основатели и лидеры движения', type: 'list', itemLabel: 'человек', default: ABOUT_TEAM_DEFAULT,
        hint: 'Пока список пуст, блок на странице не показывается. Вставьте ссылку на профиль или идентификатор пользователя и нажмите «Подтянуть из профиля»: имя, фото и описание заполнятся сами, их можно поправить. Можно и заполнить всё вручную.',
        fields: [
          { key: 'profileId', label: 'Профиль на сайте (ссылка или идентификатор)', type: 'profile' },
          { key: 'name', label: 'Имя и фамилия', type: 'text' },
          { key: 'role', label: 'Роль в движении', type: 'text' },
          { key: 'desc', label: 'О человеке', type: 'textarea' },
          { key: 'avatar', label: 'Ссылка на фото (https://…)', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'rules', title: 'Правила сайта', icon: 'fa-gavel', path: '/rules',
    entries: [{
      key: 'rules.sections', label: 'Разделы правил', type: 'list', itemLabel: 'раздел', default: RULES_DEFAULT,
      hint: 'Номер входит в название раздела («1. Общие положения»). Идентификатор — латиница, используется в ссылке-якоре.',
      fields: [
        { key: 'id', label: 'Идентификатор (латиницей)', type: 'text' },
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'icon', label: 'Иконка (fa-gavel)', type: 'text' },
        { key: 'items', label: 'Пункты', type: 'lines', hint: 'Каждый пункт — с новой строки.' },
      ],
    }],
  },
  {
    id: 'privacy', title: 'Политика конфиденциальности', icon: 'fa-user-shield', path: '/privacy',
    entries: [{
      key: 'privacy.sections', label: 'Разделы политики', type: 'list', itemLabel: 'раздел', default: PRIVACY_DEFAULT,
      fields: [
        { key: 'id', label: 'Идентификатор (латиницей)', type: 'text' },
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'icon', label: 'Иконка (fa-info-circle)', type: 'text' },
        { key: 'content', label: 'Текст раздела', type: 'textarea', hint: 'Пустая строка между абзацами делит текст на абзацы.' },
      ],
    }],
  },
];

/** Значение из строки сервера в рабочую форму редактора. Повреждённое значение заменяется исходным. */
export function parseStored(entry: ContentEntry, raw: string | undefined): unknown {
  if (raw === undefined) return structuredClone(entry.default);
  if (entry.type === 'text' || entry.type === 'textarea') return raw;
  try { return JSON.parse(raw); } catch { return structuredClone(entry.default); }
}

/** Рабочая форма редактора → строка для сервера. */
export function serialize(entry: ContentEntry, value: unknown): string {
  return entry.type === 'text' || entry.type === 'textarea' ? String(value ?? '') : JSON.stringify(clean(value));
}

/** Убирает пустые строки из списков строк (лишний перенос в конце не создаёт пустой пункт) на любой глубине. */
function clean(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.every(v => typeof v === 'string') ? value.filter(v => (v as string).trim() !== '') : value.map(clean);
  }
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v)]));
  return value;
}

/** Пустое значение для нового элемента списка по схеме полей. */
export function emptyItem(fields: FieldSchema[]): Record<string, unknown> {
  return Object.fromEntries(fields.map(f => [f.key, f.type === 'lines' || f.type === 'list' ? [] : '']));
}
