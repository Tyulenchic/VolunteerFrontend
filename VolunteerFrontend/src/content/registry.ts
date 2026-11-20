import {
  ABOUT_TEAM_DEFAULT, ABOUT_TEXT_DEFAULT as T, ABOUT_VALUES_DEFAULT, FAQ_DEFAULT, FOOTER_TEXT_DEFAULT as F, HOME_FEATURES_DEFAULT,
  BOOKLET_TEXT_DEFAULT as BK, HOME_PERKS_DEFAULT, HOME_STEPS_DEFAULT, HOME_TEXT_DEFAULT as H, PAGE_TEXT_DEFAULT as PG, PRIVACY_DEFAULT, RULES_DEFAULT,
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

const TITLED_FIELDS: FieldSchema[] = [
  { key: 't', label: 'Название', type: 'text' },
  { key: 'd', label: 'Описание', type: 'text' },
];

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: 'home', title: 'Главная', icon: 'fa-house', path: '/',
    entries: [
      { key: 'home.hero.title', label: 'Первый экран — заголовок', type: 'text', default: H.heroTitle },
      { key: 'home.hero.accent', label: 'Первый экран — выделенное окончание заголовка', type: 'text', default: H.heroAccent, hint: 'Показывается синим цветом после заголовка.' },
      { key: 'home.hero.lead', label: 'Первый экран — абзац под заголовком', type: 'textarea', default: H.heroLead },
      { key: 'home.features.title', label: 'Возможности портала — заголовок', type: 'text', default: H.featuresTitle },
      { key: 'home.features.sub', label: 'Возможности портала — подзаголовок', type: 'text', default: H.featuresSub },
      {
        key: 'home.features.items', label: 'Возможности портала — карточки', type: 'list', itemLabel: 'карточка', default: HOME_FEATURES_DEFAULT,
        hint: 'Показываются первые четыре карточки по порядку. Ссылки и цвета карточек заданы в коде и от текста не зависят.',
        fields: TITLED_FIELDS,
      },
      { key: 'home.community.title', label: 'Сообщество — заголовок', type: 'text', default: H.communityTitle },
      { key: 'home.community.lead', label: 'Сообщество — абзац', type: 'textarea', default: H.communityLead },
      {
        key: 'home.community.perks', label: 'Сообщество — преимущества', type: 'list', itemLabel: 'преимущество', default: HOME_PERKS_DEFAULT,
        fields: TITLED_FIELDS,
      },
      { key: 'home.steps.title', label: 'Как начать путь — заголовок', type: 'text', default: H.stepsTitle },
      { key: 'home.steps.sub', label: 'Как начать путь — подзаголовок', type: 'text', default: H.stepsSub },
      {
        key: 'home.steps.items', label: 'Как начать путь — шаги', type: 'list', itemLabel: 'шаг', default: HOME_STEPS_DEFAULT,
        hint: 'Показываются первые четыре шага: нумерация и сетка рассчитаны на четыре.',
        fields: TITLED_FIELDS,
      },
      { key: 'home.feedback.title', label: 'Обратная связь — заголовок', type: 'text', default: H.feedbackTitle },
      { key: 'home.feedback.text', label: 'Обратная связь — абзац', type: 'textarea', default: H.feedbackText },
      { key: 'home.gallery.title', label: 'Как это было — заголовок', type: 'text', default: H.galleryTitle },
      { key: 'home.gallery.sub', label: 'Как это было — подзаголовок', type: 'text', default: H.gallerySub },
      { key: 'home.gallery.empty', label: 'Как это было — надпись, когда материалов нет', type: 'text', default: H.galleryEmpty },
      { key: 'home.gallery.all', label: 'Как это было — кнопка перехода к видео', type: 'text', default: H.galleryAll },
      { key: 'home.news.title', label: 'Последние новости — заголовок', type: 'text', default: H.newsTitle },
      { key: 'home.news.empty', label: 'Последние новости — надпись, когда новостей нет', type: 'text', default: H.newsEmpty },
      { key: 'home.news.all', label: 'Последние новости — кнопка перехода ко всем новостям', type: 'text', default: H.newsAll },
    ],
  },
  {
    id: 'footer', title: 'Подвал сайта', icon: 'fa-table-columns', path: '/',
    entries: [
      { key: 'footer.about', label: 'Описание портала', type: 'textarea', default: F.about },
      { key: 'footer.address', label: 'Адрес', type: 'text', default: F.address, hint: 'Почта и телефон в подвале берутся из «О нас → Контакты»: меняйте их там.' },
      { key: 'footer.hours', label: 'Часы работы', type: 'text', default: F.hours },
      { key: 'footer.copyright', label: 'Строка об авторских правах', type: 'text', default: F.copyright },
    ],
  },
  {
    id: 'pages', title: 'Заголовки страниц', icon: 'fa-heading', path: '/events',
    entries: [
      { key: 'pages.events.title', label: 'Мероприятия — заголовок', type: 'text', default: PG.eventsTitle },
      { key: 'pages.events.accent', label: 'Мероприятия — выделенное слово заголовка', type: 'text', default: PG.eventsAccent, hint: 'Показывается цветом после заголовка.' },
      { key: 'pages.events.lead', label: 'Мероприятия — вступление', type: 'textarea', default: PG.eventsLead },
      { key: 'pages.videos.title', label: 'Видео — заголовок', type: 'text', default: PG.videosTitle },
      { key: 'pages.videos.accent', label: 'Видео — выделенное слово заголовка', type: 'text', default: PG.videosAccent },
      { key: 'pages.videos.lead', label: 'Видео — вступление', type: 'textarea', default: PG.videosLead },
      { key: 'pages.news.title', label: 'Новости — заголовок', type: 'text', default: PG.newsTitle },
      { key: 'pages.news.accent', label: 'Новости — выделенное слово заголовка', type: 'text', default: PG.newsAccent },
      { key: 'pages.news.lead', label: 'Новости — вступление', type: 'textarea', default: PG.newsLead },
      { key: 'pages.organizations.title', label: 'Организации — заголовок', type: 'text', default: PG.organizationsTitle },
      { key: 'pages.organizations.accent', label: 'Организации — выделенное слово заголовка', type: 'text', default: PG.organizationsAccent },
      { key: 'pages.organizations.lead', label: 'Организации — вступление', type: 'textarea', default: PG.organizationsLead },
      { key: 'pages.organizers.badge', label: 'Организаторы — плашка над заголовком', type: 'text', default: PG.organizersBadge },
      { key: 'pages.organizers.title', label: 'Организаторы — начало заголовка', type: 'text', default: PG.organizersTitle },
      { key: 'pages.organizers.accent', label: 'Организаторы — выделенное слово заголовка', type: 'text', default: PG.organizersAccent },
      { key: 'pages.organizers.tail', label: 'Организаторы — конец заголовка', type: 'text', default: PG.organizersTail },
      { key: 'pages.organizers.lead', label: 'Организаторы — вступление', type: 'textarea', default: PG.organizersLead },
      { key: 'pages.volunteers.badge', label: 'Волонтёры — плашка над заголовком', type: 'text', default: PG.volunteersBadge },
      { key: 'pages.volunteers.title', label: 'Волонтёры — начало заголовка', type: 'text', default: PG.volunteersTitle },
      { key: 'pages.volunteers.accent', label: 'Волонтёры — выделенное слово заголовка', type: 'text', default: PG.volunteersAccent },
      { key: 'pages.volunteers.tail', label: 'Волонтёры — конец заголовка', type: 'text', default: PG.volunteersTail },
      { key: 'pages.volunteers.lead', label: 'Волонтёры — вступление', type: 'textarea', default: PG.volunteersLead },
      { key: 'pages.volunteers.stat.actions', label: 'Волонтёры — число акций в счётчике', type: 'text', default: PG.volunteersStatActions, hint: 'Это число вписывается вручную, сайт его не считает: держите его актуальным.' },
      { key: 'pages.volunteers.stat.years', label: 'Волонтёры — срок движения в счётчике', type: 'text', default: PG.volunteersStatYears, hint: 'Это значение вписывается вручную, сайт его не считает: держите его актуальным.' },
    ],
  },
  {
    id: 'booklet', title: 'Добровольческая книжка', icon: 'fa-id-card', path: '/profile',
    entries: [
      { key: 'booklet.title', label: 'Заголовок окна в профиле', type: 'text', default: BK.title },
      { key: 'booklet.teaser', label: 'Короткий текст в карточке профиля', type: 'textarea', default: BK.teaser },
      { key: 'booklet.intro', label: 'Вступление в окне «Узнать подробнее»', type: 'textarea', default: BK.intro },
      { key: 'booklet.benefits.title', label: 'Заголовок списка льгот', type: 'text', default: BK.benefitsTitle },
      { key: 'booklet.benefits', label: 'Льготы и возможности', type: 'lines', default: BK.benefits, hint: 'Каждый пункт — с новой строки. Впишите, когда будет готов официальный перечень.' },
      { key: 'booklet.data.title', label: 'Заголовок списка данных', type: 'text', default: BK.dataTitle },
      { key: 'booklet.data', label: 'Какие данные собираются', type: 'lines', default: BK.data, hint: 'Каждый пункт — с новой строки.' },
      { key: 'booklet.how.title', label: 'Заголовок «Как получить»', type: 'text', default: BK.howTitle },
      { key: 'booklet.how', label: 'Как получить книжку', type: 'textarea', default: BK.how },
      { key: 'booklet.photo-hint', label: 'Подсказка про качество фото', type: 'textarea', default: BK.photoHint },
    ],
  },
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
