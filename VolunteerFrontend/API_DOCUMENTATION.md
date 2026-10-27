# VolunteerAPI — Полная документация для фронтенда (React + TypeScript)

> **Справочная копия.** Источник истины — `docs/05-api-contract.md` в репозитории VolunteerAPI; при расхождениях верьте ему. Актуальные дополнения к этому файлу: статус заявки `Withdrawn` и поле `withdrawalReason` (отозванная волонтёром заявка остаётся в списках), теги мероприятий (`tags` в `CreateEventDto`/`UpdateEventDto`/`EventResponseDto`, поиск `search` ищет и по тегам), отказ/отзыв с комментарием — `POST /api/participations/{id}/cancel { reason? }`.

Этот документ — исчерпывающая справочная информация по REST API проекта "ВолонтёрыПМР" (серверная часть). Цель: дать фронтенд-разработчику точные пути, DTO, правила валидации, примеры запросов/ответов и рекомендации по реализации клиентов в React + TypeScript.

Файлы источника: контроллеры в `API/Controllers` и DTO/Enums в `ClassLibrary_BusinessLogic` / `ClassLibrary_Domain`. Документ создан по изучению текущего кода в репозитории (см. `API/Controllers/*.cs`, `ClassLibrary_BusinessLogic/DTOs/**`, `ClassLibrary_Domain/Enums/**`).

Содержание
- 1. Общая информация о API
- 2. Эндпоинты (по категориям)
  - AUTH
  - USERS
  - EVENTS
  - PARTICIPATIONS
  - ADMIN
  - NEWS
  - NOTIFICATIONS
  - FEEDBACK
  - ANALYTICS
- 3. DTO / TypeScript-интерфейсы
- 4. Enums (перечисления)
- 5. Пагинация и фильтрация
- 6. Ошибки и формат ошибок
- 7. Authentication & Authorization (JWT, refresh)
- 8. Примеры использования (fetch / axios)
- 9. Swagger / OpenAPI
- 10. Best practices и рекомендации
- Приложение: краткие таблицы эндпоинтов

---

## 1. Общая информация о API

- Base URL (базовый префикс): `{API_BASE_URL}/api`
  - В среде разработки `App:BaseUrl` = `https://localhost:7001` (см. `API/appsettings.json`). Полный пример: `https://localhost:7001/api`.
- Версия API: `v1` (Swagger настроен как `v1`).
- Формат запросов и ответов: JSON (`application/json`) для CRUD-операций. Для загрузки файлов используется `multipart/form-data`.
- Аутентификация: JWT (Bearer) — access token + refresh token (ротация refresh токенов).
  - Access token передаётся в заголовке `Authorization: Bearer <accessToken>`.
  - Refresh token — отправляется в теле запросов для эндпоинтов `/api/auth/refresh` и `/api/auth/logout` (сервер ожидает DTO с полем `refreshToken`).
- Где и как хранить токены (рекомендации):
  - Backend ожидает refresh token в теле запроса, поэтому без изменений сервера фронт должен хранить refresh токен доступным для JS (например, в памяти, IndexedDB или localStorage). Это небезопасно с точки зрения XSS.
  - Рекомендуемая безопасная схема: хранить Refresh Token в HttpOnly Secure cookie и изменить бекенд (или добавить поддержку чтения cookie) — тогда refresh будет автоматически отправляться браузером и будет защищён от XSS. Пока сервер ожидает токен в теле, обсудите с бэкендом изменение на cookie-based refresh.
  - Access token — хранить в памяти (react state, context) и обновлять по refresh; краткоживущий access token в localStorage повышает риск XSS.
- Требования к заголовкам:
  - Для JSON: `Content-Type: application/json`, `Accept: application/json`.
  - Для авторизации: `Authorization: Bearer <accessToken>` для защищённых эндпоинтов.
  - Для загрузки файлов: не указывайте `Content-Type` вручную при использовании FormData — браузер выставит boundary.
- CORS: список разрешённых origin указан в `appsettings.json` (`AllowedOrigins` содержит `http://localhost:3000` и другие).
- Rate limiting: настроено для auth-операций:
  - `auth-strict` — 5000 запросов / 3 минуты на IP (применяется к register/login/forgot-password/reset-password/change-password).
  - `auth-light` — 3000 запросов / 1 минута на IP (refresh/confirm-email/upload-avatar).

---

## 2. Полная документация по эндпоинтам

Во всех таблицах: если указан `Authorization`, значит нужен access token в заголовке `Authorization: Bearer <token>`; если указано `Roles` — нужен пользователь с одной из этих ролей.

Общие правила сериализации:
- JSON-свойства сериализуются в camelCase.
- Перечисления сериализуются как строки (string enums) — например `EventStatus: "Published"`.
- Даты — ISO 8601 строки (UTC) — например `"2026-06-10T12:00:00Z"`.

---

### AUTH (Аутентификация)

Всё, что нужно для регистрации/входа/refresh/logout/email confirmation/password reset.

Base route: `/api/auth`

1) POST /api/auth/register
- Описание: регистрация нового пользователя. На почту будет отправлено письмо подтверждения (асинхронно). Токены НЕ выдаются: пользователь входит только после подтверждения email.
- Авторизация: нет
- Request Body (RegisterDto):

| Поле | Тип | Required | Валидаторы |
|---|---:|---:|---|
| email | string | yes | email, maxLength 256 |
| password | string | yes | minLength 8, maxLength 100 |
| firstName | string | no | maxLength 100 |
| lastName | string | no | maxLength 100 |
| consentGiven | boolean | yes | — |

- Response 202 Accepted (одинаково для нового и уже существующего email — защита от перечисления аккаунтов); тело без токенов:
```json
{ "message": "If this email is registered with us, you will receive further instructions by email." }
```
- Ошибки: 400 Bad Request (валидация, нет согласия `consentGiven`).
- Пример (axios):

```ts
await axios.post(`${API_BASE}/api/auth/register`, {
  email: 'user@example.com',
  password: 'password123',
  firstName: 'Иван',
  lastName: 'Иванов',
  consentGiven: true
});
```

---
2) POST /api/auth/login
- Описание: логин — возвращает access + refresh.
- Авторизация: нет
- Request Body (LoginDto):

| Поле | Тип | Required |
|---|---:|---:|
| email | string | yes |
| password | string | yes |

- Response 200 OK: AuthResponseDto (см. выше)
- Ошибки: 400 Bad Request (валидация), 403 Forbidden (email не подтверждён или блокировка), 400/403 (неверный пароль — DomainException → 400)

Пример:
```ts
const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
// сохранить res.data.accessToken и res.data.refreshToken
```

---
3) POST /api/auth/refresh
- Описание: обновляет access-token по refresh-токену (ротация). Сервер ожидает тело `{ refreshToken: string }`.
- Авторизация: нет (AllowAnonymous)
- Request Body (RefreshTokenRequestDto):

| Поле | Тип | Required |
|---|---:|---:|
| refreshToken | string | yes |

- Response 200 OK: новый AuthResponseDto (новый accessToken + новый refreshToken)
- Ошибки: 400 Bad Request (invalid/expired token)

Пример (axios):
```ts
const res = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
```

Важно: refresh-токен в бекенде хранится в БД хэшированным; при refresh происходит ротация (старый помечается как revoked и создаётся новый).

---
4) POST /api/auth/logout
- Описание: отзыв данного refresh-токена (logout текущего устройства). Требуется авторизация (access token).
- Авторизация: да (Authorization header)
- Request Body: RefreshTokenRequestDto `{ refreshToken: string }`.
- Response 204 No Content
- Ошибки: 400 Bad Request (invalid token)

Пример:
```ts
await axios.post(`${API_BASE}/api/auth/logout`, { refreshToken }, { headers: { Authorization: `Bearer ${accessToken}` } });
```

---
5) POST /api/auth/confirm-email
- Описание: подтверждение email по токену из письма. Только POST (операция меняет состояние; GET-ссылка из письма вела бы к «сгоранию» токена почтовыми сканерами). Ссылка в письме ведёт на страницу фронтенда `{App:FrontendBaseUrl}/#/confirm-email?token=...`, которая отправляет POST по нажатию кнопки пользователем.
- Авторизация: нет
- Request Body (ConfirmEmailDto): `{ "token": "<string>" }`
- Response 200 OK: `{ message: 'Email успешно подтверждён.' }`
- Ошибки: 400 Bad Request (invalid/expired token) — тело `{ "error": "..." }`

---
6) POST /api/auth/resend-confirmation
- Описание: повторная отправка письма подтверждения. Всегда 204 — не раскрывает, существует ли аккаунт и подтверждён ли он.
- Авторизация: нет
- Request Body (ResendConfirmationDto): `{ "email": "<string>" }`
- Response 204 No Content

---
7) POST /api/auth/forgot-password
- Описание: отправить ссылку/токен для сброса пароля (всегда 204 — не раскрывает, существует ли email).
- Авторизация: нет
- Request Body: ForgotPasswordDto `{ email }` (валидатор Email)
- Response 204 No Content

---
8) POST /api/auth/reset-password
- Описание: сброс пароля по токену (из письма). Ссылка в письме ведёт на страницу фронтенда `{App:FrontendBaseUrl}/#/reset-password?token=...`.
- Авторизация: нет
- Request Body: ResetPasswordDto `{ token, newPassword }`
- Response: 204 No Content
- Ошибки: 400 Bad Request (invalid/expired token, валидация пароля)

---
9) POST /api/auth/revoke-all
- Описание: отзыв всех refresh токенов для текущего пользователя (logout со всех устройств).
- Авторизация: да
- Response 204 No Content

---

### USERS (Пользователи)

Base route: `/api/users`

1) GET /api/users — (Admin)
- Описание: постраничный список всех пользователей.
- Authorization: Admin
- Query params:
  - skip (int, default 0)
  - take (int, default 20)
  - search (string?)
  - role (UserRole? string) — допустимые значения: `Volunteer`, `Organizer`, `Admin`
  - isBlocked (bool?)
- Response: UserListResponseDto

2) GET /api/users/{id} — (Admin)
- Описание: получить пользователя по ID
- Authorization: Admin
- Response: UserResponseDto

3) GET /api/users/organizers
- Описание: публичный список организаторов (frontend: команда организаторов)
- Authorization: none
- Query: skip (default 0), take (default 50), search
- Response: UserListResponseDto

4) GET /api/users/volunteers
- Описание: публичный список волонтёров
- Authorization: none
- Query: skip (default 0), take (default 50), search
- Response: UserListResponseDto

5) GET /api/users/me
- Описание: получить профиль текущего пользователя
- Authorization: да
- Response: UserResponseDto

6) PUT /api/users/me
- Описание: обновить профиль (firstName, lastName, bio)
- Authorization: да
- Request: UpdateProfileDto
- Response: UserResponseDto

7) PUT /api/users/me/password
- Описание: смена пароля — требуется currentPassword
- Authorization: да
- Request: ChangePasswordDto `{ currentPassword, newPassword }`
- Response: 204 No Content

8) POST /api/users/me/avatar (multipart/form-data)
- Описание: загрузка аватара (field `file`), лимит 5 MB (в коде `MaxAvatarSize = 5*1024*1024`). Разрешённые форматы jpeg/png/webp.
- Authorization: да
- Request: multipart/form-data form field `file` (IFormFile)
- Response: 200 OK `{ avatarUrl: string }`

9) DELETE /api/users/me/avatar
- Описание: удалить аватар
- Authorization: да
- Response: 204 No Content

10) GET /api/users/avatars/{**storageKey}
- Описание: скачать аватар (локальное хранилище), публично доступно. В случае Cloudinary — использовать avatarUrl в DTO.
- Authorization: none
- Response: file stream / 404

11) DELETE /api/users/me
- Описание: удалить аккаунт (GDPR) — анонимизация
- Authorization: да
- Response: 204 No Content

12) POST /api/users/me/revoke-consent
- Описание: отозвать согласие на обработку ПДн
- Authorization: да
- Response: 204 No Content

13) POST /api/users/{id}/block и /api/users/{id}/unblock
- Описание: блок/разблокировка — Admin only
- Authorization: Admin
- Request bodies: (BlockUserRequestDto/UnblockUserRequestDto) — содержат `reason` (string / optional)

14) PUT /api/users/{id}/role
- Описание: изменить роль пользователя (Admin)
- Request body: new role (enum string) — `Volunteer`|`Organizer`|`Admin`
- Response: 204 No Content

> Замечание: "Получить статистику пользователя" реализовано как часть admin-DTO `AdminUserDetailDto` доступного через `GET /api/admin/users/{userId}` — этот DTO содержит поля `ParticipationsCount`, `AttendedEventsCount`, `OrganizedEventsCount`.

---

### EVENTS (Мероприятия)

Base route: `/api/events`

1) GET /api/events/actual
- Описание: публичный список опубликованных мероприятий, сортировка по StartsAt.
- Authorization: none
- Query: ctg (EventCategory?), skip (default 0), take (default 20)
- Response: EventListResponseDto

2) GET /api/events
- Описание: список мероприятий с фильтрами (Admin/Organizer)
- Authorization: Roles = Admin, Organizer
- Query: ctg, skip (0), take (20), status (EventStatus?)
- Response: EventListResponseDto

3) GET /api/events/{id}
- Описание: получить мероприятие по id
- Authorization: none
- Response: EventResponseDto

4) POST /api/events
- Описание: создать мероприятие (Organizer/Admin)
- Authorization: Roles = Admin, Organizer
- Request: CreateEventDto
- Response: 201 Created — EventResponseDto

5) PUT /api/events/{id}
- Описание: обновить мероприятие (Organizer только свои draft, Admin любые)
- Authorization: Roles = Admin, Organizer
- Request: UpdateEventDto
- Response: 200 OK EventResponseDto

6) PATCH /api/events/{id}/max-participants
- Описание: обновить лимит участников (Admin/Organizer)
- Authorization: Roles = Admin, Organizer
- Request: UpdateMaxParticipantsDto `{ maxParticipants: number? }`
- Response: 200 OK EventResponseDto

7) DELETE /api/events/{id}
- Описание: удалить мероприятие (только Draft или Cancelled)
- Authorization: Roles = Admin, Organizer
- Response: 204 No Content

8) POST /api/events/{id}/image (multipart/form-data)
- Описание: загрузка/замена изображения мероприятия (поле `file`), лимит 10 MB (`RequestSizeLimit(11_000_000)` в контроллере)
- Authorization: Roles = Admin, Organizer
- Response: 200 OK EventResponseDto

9) DELETE /api/events/{id}/image
- Описание: удалить изображение мероприятия
- Authorization: Roles = Admin, Organizer
- Response: 204 No Content

10) POST /api/events/{id}/publish
- Описание: смена статуса Draft → Published
- Authorization: Roles = Admin, Organizer
- Response: 204 No Content

11) POST /api/events/{id}/cancel
- Описание: Published → Cancelled
- Authorization: Roles = Admin, Organizer
- Response: 204 No Content

12) POST /api/events/{id}/complete
- Описание: Published → Completed
- Authorization: Roles = Admin, Organizer
- Response: 204 No Content

13) GET /api/events/{eventId}/participations  (через ParticipationController)
- Описание: получить заявки/участников/attendees на мероприятие (Admin/Organizer)
- Authorization: Roles = Admin, Organizer
- Response: list of ParticipationResponseDto

---

### PARTICIPATIONS (Участия в мероприятиях)

Маршруты распределены между `ParticipationController` и `AdminController`.

1) POST /api/events/{eventId}/apply
- Описание: подать заявку (волонтёр)
- Authorization: да
- Response: 201 Created ParticipationResponseDto
- Ошибки: 400/409 (уже подал / мероприятие полное / не опубликовано)

2) DELETE /api/participations/{participationId}
- Описание: отозвать своё участие (только Pending)
- Authorization: да
- Response: 204 No Content

3) GET /api/users/me/activities
- Описание: получить свои участия
- Authorization: да
- Response: ParticipationResponseDto[]

4) GET /api/events/{eventId}/participations
- Описание: получить все заявки мероприятия (Admin/Organizer), с фильтром status
- Authorization: Roles = Admin, Organizer
- Query: status (ParticipationStatus?)
- Response: ParticipationResponseDto[]

5) GET /api/events/{eventId}/applicants
- Описание: заявки со статусом Pending (Admin/Organizer)

6) GET /api/events/{eventId}/participants
- Описание: заявки со статусом Approved (Admin/Organizer)

7) GET /api/events/{eventId}/attendees
- Описание: заявки со статусом AttendanceConfirmed (Admin/Organizer)

8) POST /api/participations/{participationId}/review
- Описание: одобрить/отклонить заявку, тело — ReviewParticipationDto `{ approved: boolean, comment?: string }` (Admin/Organizer)
- Response: ParticipationResponseDto

9) POST /api/participations/{participationId}/confirm-attendance
- Описание: подтвердить посещение (Admin/Organizer), опционально `{ comment?: string }`
- Response: ParticipationResponseDto

---

### ADMIN (Админка)

Base route: `/api/admin` — класс `AdminController` помечен `[Authorize(Roles = "Admin")]` — всё требует роль Admin.

1) GET /api/admin/dashboard — AdminDashboardDto (полный набор виджетов и списков для админки)
2) GET /api/admin/stats — AdminStatsDto
3) GET /api/admin/users — постраничный список пользователей + фильтры
4) GET /api/admin/users/{userId} — AdminUserDetailDto (полная информация + статистика пользователя)
5) POST /api/admin/users/{userId}/block — BlockUserRequestDto `{ reason: string }`
6) POST /api/admin/users/{userId}/unblock — UnblockUserRequestDto `{ reason?: string }`
7) POST /api/admin/users/{userId}/change-role — ChangeUserRoleRequestDto `{ newRole: string }`
8) GET /api/admin/participations — список заявок с фильтрами
9) POST /api/admin/participations/{id}/approve, /reject — Approve/RejectParticipationRequestDto `{ comment?: string }`
10) POST /api/admin/participations/bulk-approve, /bulk-reject — body с `participationIds: string[]`
11) GET /api/admin/news — список новостей с фильтрами
12) POST /api/admin/news/{newsId}/publish, /unpublish, /archive, /restore — операции над новостями
13) GET /api/admin/events — список событий (с фильтрами)
14) GET /api/admin/events/{eventId}/statistics — AdminEventStatisticsDto
15) GET /api/admin/audit-log — журнал аудита (фильтрация по actionType и adminUserId)
16) GET /api/admin/analytics?monthsBack=n — AdminAnalyticsDto (регистрации, тренды, топы)

**Notifications (Admin)**
- GET /api/admin/notifications — постранично
- GET /api/admin/notifications/unread — UnreadNotificationsResponseDto
- GET /api/admin/notifications/unread-count — { UnreadCount: number }
- POST /api/admin/notifications/{notificationId}/read — отметить уведомление прочитанным
- POST /api/admin/notifications/mark-all-read — отметить все прочитанными

> Замечание: в коде реализован сервис и контроллер для *Admin* notifications (`AdminNotification`). Эндпоинты для уведомлений обычных пользователей (не-админов) в репозитории не найдены — если вам нужны пользовательские уведомления, нужно уточнить у бэкенда (в коде есть только AdminNotificationRepository/Service).

---

### NEWS (Новости)

Base route: `/api/news`

1) GET /api/news/actual — публично, краткий список (skip, take default 10)
2) GET /api/news — общий список (публично)
3) GET /api/news/{id} — получить новость
4) POST /api/news — Admin: CreateNewsDto `{ title, content, summary? }` → 201 NewsResponseDto
5) PUT /api/news/{id} — Admin: UpdateNewsDto
6) DELETE /api/news/{id} — Admin: 204
7) POST /api/news/{id}/image — загрузка картинки (multipart/form-data, поле file, лимит 10MB)
8) POST /api/news/{id}/publish, /unpublish, /archive — Admin

---

### NOTIFICATIONS

- В коде есть только админские уведомления (`/api/admin/notifications/*`). Эндпоинтов для получения уведомлений обычного пользователя (`/api/users/me/notifications` и т.д.) не обнаружено.

---

### FEEDBACK (Отзывы)

Base route: `/api/feedback`

1) POST /api/feedback — CreateFeedbackDto `{ name, email, message }` — публично — Response 201 FeedbackResponseDto
2) GET /api/feedback — Admin: список отзывов (skip/take)
3) GET /api/feedback/{id} — Admin: feedback detail
4) POST /api/feedback/{id}/read — Admin: пометить как прочитанное

> Замечание: endpoint для удаления отзыва (DELETE) не найден в контроллере `FeedbackController`.

---

### ANALYTICS

- GET /api/admin/analytics?monthsBack=12 — возвращает `AdminAnalyticsDto` содержащий registration trends, participation trends, event trends, top events, top volunteers, top organizers.

---

## 3. DTO (Data Transfer Objects) — TypeScript интерфейсы

Ниже приведены ключевые DTO, конвертированные в TypeScript-типизацию, чтобы вы могли сразу использовать их в React + TypeScript.

Общие замечания:
- C# `Guid` → `string` (UUID)
- `DateTime` → `string` (ISO 8601)
- `int`, `decimal` → `number`
- `bool` → `boolean`
- `IReadOnlyList<T>` → `T[]`
- Enums сериализуются как строки — TypeScript ожидает строковые union-типы.

Примеры интерфейсов (полный набор DTO в коде; ниже приведены самые важные):

```ts
// Auth
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string; // ISO 8601
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  consentGiven: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

// User
export type UserRole = 'Volunteer' | 'Organizer' | 'Admin';

export interface UserResponseDto {
  id: string;
  email: string;
  emailConfirmed: boolean;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UserListResponseDto {
  items: UserResponseDto[];
  totalCount: number;
  skip: number;
  take: number;
  search?: string | null;
  role?: UserRole | null;
  isBlocked?: boolean | null;
}

export interface UpdateProfileDto {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Event
export type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Completed';
export type EventCategory =
  | 'Veterans' | 'Medical' | 'Donation' | 'Animals' | 'HealthyLife' | 'Culture'
  | 'Education' | 'Media' | 'Social' | 'Events' | 'Patriotic' | 'Urban' | 'Ecological';

export interface CreateEventDto {
  title: string;
  description: string;
  location: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  maxParticipants?: number | null;
  category: EventCategory;
}

export interface UpdateEventDto extends CreateEventDto {}

export interface UpdateMaxParticipantsDto {
  maxParticipants?: number | null;
}

export interface EventResponseDto {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  maxParticipants?: number | null;
  imageUrl?: string | null;
  category: EventCategory;
  approvedCount: number;
  status: EventStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface EventListResponseDto {
  items: EventResponseDto[];
  totalCount: number;
  skip: number;
  take: number;
  status?: EventStatus | null;
  category?: EventCategory | null;
}

// Participation
export type ParticipationStatus = 'Pending' | 'Approved' | 'Rejected' | 'AttendanceConfirmed' | 'Withdrawn';

export interface ParticipationResponseDto {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userFullName?: string | null;
  status: ParticipationStatus;
  adminComment?: string | null;
  withdrawalReason?: string | null; // комментарий волонтёра при отзыве (Withdrawn)
  createdAt: string;
  updatedAt?: string | null;
}

// News
export type NewsStatus = 'Draft' | 'Published' | 'Archived';

export interface CreateNewsDto {
  title: string;
  content: string;
  summary?: string | null;
}

export interface NewsResponseDto {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  imageUrl?: string | null;
  status: NewsStatus;
  authorId: string;
  authorFullName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  publishedAt?: string | null;
}

// Admin DTOs (выдержки)
export interface AdminStatsDto {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalOrganizers: number;
  totalVolunteers: number;
  totalEvents: number;
  draftEvents: number;
  publishedEvents: number;
  cancelledEvents: number;
  completedEvents: number;
  totalParticipations: number;
  pendingParticipations: number;
  approvedParticipations: number;
  rejectedParticipations: number;
  totalNews: number;
  draftNews: number;
  publishedNews: number;
  archivedNews: number;
  totalFeedbacks: number;
  unreadFeedbacks: number;
}

export interface AdminDashboardDto {
  statistics: AdminStatsDto;
  recentNews: any[]; // уточните по нужде
  upcomingEvents: any[];
  recentParticipations: any[];
  unreadNotificationsCount: number;
}
```

> Примечание: в проекте DTO реализованы в папках `ClassLibrary_BusinessLogic/DTOs/*`. Приведены ключевые поля; для полного списка проверьте соответствующие файлы DTO.

---

## 4. Enums (перечисления)

Сервер сериализует enum как string. Ниже — список значений, используемых на фронте.

- EventStatus: `"Draft"`, `"Published"`, `"Cancelled"`, `"Completed"`
- EventCategory:
  - `"Veterans"`, `"Medical"`, `"Donation"`, `"Animals"`, `"HealthyLife"`, `"Culture"`, `"Education"`, `"Media"`, `"Social"`, `"Events"`, `"Patriotic"`, `"Urban"`, `"Ecological"`
- ParticipationStatus: `"Pending"`, `"Approved"`, `"Rejected"`, `"AttendanceConfirmed"`, `"Withdrawn"`
- UserRole: `"Volunteer"`, `"Organizer"`, `"Admin"`
- NewsStatus: `"Draft"`, `"Published"`, `"Archived"`

---

## 5. Пагинация и фильтрация

- Механика пагинации: `skip` и `take` (offset-based). Во многих эндпоинтах дефолты: `skip=0`, `take=20` (для публичных списков организаторов/волонтёров `take=50`).
- Максимальные значения `take`: явных ограничений (`maxTake`) в коде не обнаружено — следует согласовать с бэкендом. Некоторые контроллеры устанавливают ограничение размера запроса для загрузок (например, avatar 6_000_000, event image 11_000_000), но не на `take`.
- Параметры фильтрации (часто встречающиеся):
  - status (EventStatus/NewsStatus/ParticipationStatus)
  - category / ctg (EventCategory)
  - search (строка поиска)
  - from/to (диапазон дат) — доступно в сервисах событий, если нужно (в контроллерах публичных методов параметры from/to иногда передаются дальше в сервис)
  - role (UserRole) — при поиске пользователей
- Сортировка: в публичных списках для событий — по StartsAt (по умолчанию сортировка возрастающая). Для других списков сортировка определяется сервисом (обычно по дате создания, reverse chronological).

---

## 6. Ошибки

Формат ошибок унифицирован через `ExceptionMiddleware`.

- Структура ответа ошибок (JSON):
  - Для стандартных ошибок: `{ "error": "описание" }` (camelCase)
  - Для Internal Server Error (500) — при включённом флаге `App:ExposeExceptionDetails=true` вернётся `{ "error": "...", "detail": "stacktrace..." }`.
  - Валидационные ошибки (ModelState) возвращаются стандартным `ProblemDetails` от ASP.NET Core (обычно 400 + details с полями ошибок).

- Стандартные HTTP-коды соответствия:
  - 400 Bad Request — общие ошибки валидации / DomainException / InvalidToken / TokenExpired
  - 401 Unauthorized — JWT не передан или некорректен (похватает middleware JWT)
  - 403 Forbidden — авторизован, но недостаточно прав (UnauthorizedAccessException мапится в 403)
  - 404 Not Found — ресурс не найден (UserNotFound, EventNotFound и т. п.)
  - 409 Conflict — EmailAlreadyExists, AlreadyParticipating, DbUpdateConcurrencyException и т. п.
  - 429 Too Many Requests — rate limiting
  - 500 Internal Server Error — необработанные ошибки

Пример ошибки 400:
```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{ "error": "Неверный токен или он просрочен." }
```

Пример валидации (ModelState) — зависит от ASP.NET: обычно `application/problem+json` с `errors` полями.

---

## 7. Authentication & Authorization — детали

- Access token: JWT, подпись HS256, выдаётся при логине/регистрации/refresh.
  - AccessTokenLifetimeMinutes: значение задаётся в `appsettings.json` (`Jwt:AccessTokenLifetimeMinutes`). По умолчанию (в коде) — 15 минут, но в `appsettings.json` проекта установлено `525600` (365 дней) — проверьте текущую конфигурацию окружения.
  - AccessToken содержит claims: sub (userId), email, role и jti.
- Refresh token: сервер генерирует случайный токен и хеширует его для хранения в БД; токен имеет срок (по умолчанию в коде `lifetimeDays = 30`).
- Механизм обновления: при refresh происходит ротация — старый refresh помечается как revoked и создаётся новый.
- Какие endpoints требуют авторизации: см. секцию по эндпоинтам; кратко — все `POST/PUT/DELETE` для ресурсов, изменяющих данные, требуют Authorization. Контроллеры помечены либо `[Authorize]` либо `[AllowAnonymous]`.
- Role-based access: контроллеры используют Roles: `Admin`, `Organizer`.
  - Пример: `POST /api/events` — Roles = `Admin, Organizer`.


---

## 8. Примеры использования (fetch / axios)

Ниже — шаблонные примеры. Подключите `axios` или используйте fetch; для axios удобно настроить интерцепторы для автоматического обновления токенов.

1) Login + сохранение токенов (axios)

```ts
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://localhost:7001';

async function login(email: string, password: string) {
  const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
  const data = res.data as AuthResponseDto;
  // Сохраните accessToken в памяти (React Context) и refreshToken — в соответствии с политикой безопасности
  return data;
}
```

2) Axios instance с interceptor для refresh

```ts
import axios from 'axios';

const api = axios.create({ baseURL: `${API_BASE}/api`, headers: { Accept: 'application/json' } });

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  r => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // здесь предполагается, что у вас есть сохранённый refreshToken
          const refreshToken = localStorage.getItem('refreshToken');
          const r = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
          const newAccess = r.data.accessToken;
          // применяем новый токен
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          isRefreshing = false;
          refreshQueue.forEach(cb => cb(newAccess));
          refreshQueue = [];
          return api(original);
        } catch (e) {
          isRefreshing = false;
          // redirect to login
          window.location.href = '/login';
          return Promise.reject(e);
        }
      }

      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          original.headers['Authorization'] = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }
    return Promise.reject(error);
  }
);
```

3) Пример fetch запроса к защищённому endpoint

```ts
const accessToken = getAccessTokenFromMemory();
const res = await fetch(`${API_BASE}/api/users/me`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json'
  }
});
if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
const me = await res.json();
```

4) Загрузка аватара (FormData)

```ts
async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/users/me/avatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: form
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json(); // { avatarUrl }
}
```

5) Создание мероприятия (axios)

```ts
const dto: CreateEventDto = {
  title: 'Субботник в парке',
  description: 'Описание...',
  location: 'Парк им. Ленина',
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now()+3*3600*1000).toISOString(),
  maxParticipants: 30,
  category: 'Ecological'
};
const res = await api.post('/events', dto, { headers: { Authorization: `Bearer ${accessToken}` } });
```

6) Подать заявку на мероприятие (apply)

```ts
await api.post(`/events/${eventId}/apply`, null, { headers: { Authorization: `Bearer ${accessToken}` } });
```

---

## 9. Swagger / OpenAPI

- Swagger UI доступен в режиме разработки: `/swagger` (см. `Program.cs`). OpenAPI JSON: `/swagger/v1/swagger.json`.
- Рекомендуется сгенерировать TypeScript клиент с `openapi-generator` или `swagger-codegen`. Пример с `openapi-generator`:

```bash
# cгенерировать axios-клиент (пример из терминала):
openapi-generator-cli generate -i https://localhost:7001/swagger/v1/swagger.json -g typescript-axios -o ./frontend/src/apiClient --additional-properties=supportsES6=true
```

---

## 10. Best Practices / Рекомендации для фронтенда

- Rate limiting: для форм логина/регистрации/восстановления пароля используйте debounce и блокировку кнопки после N попыток, чтобы не триггерить rate-limit.
- Debouncing: поиск (search) — debounce 300–500ms.
- Caching: кешировать неизменные списки (например, organizers list) с short TTL. Для событий и новостей используйте stale-while-revalidate.
- Error handling: ожидайте `{ error: string }` для domain ошибок и `ProblemDetails` для validation errors. Показывайте user-friendly сообщения.
- Loading states: всегда показывайте локальные индикаторы загрузки для операций, требующих сетевого отклика.
- Token refresh race: используйте queue/lock в interceptor, чтобы одновременно не отправлять несколько refresh-запросов.
- File uploads: учитывайте лимиты (avatars 5MB, event/news images 10MB) — проверяйте локально перед отправкой.
- Enum values: на фронте используйте union-тип/enum-списки — сервер присылает строки.
- Формат дат: сервер — ISO 8601 UTC. Конвертируйте в локальное представление на фронте при отображении.

---

## Приложение: краткий список всех эндпоинтов (таблично)

Файл `API/Controllers` содержит следующие контроллеры и эндпоинты (полные детали см. выше):

- `AuthController` — `/api/auth` (register, login, refresh, logout, confirm-email, resend-confirmation, forgot-password, reset-password, revoke-all)
- `UserController` — `/api/users` (GetOrganizers, GetVolunteers, GetMe, UpdateProfile, ChangePassword, Upload/Delete avatar, Admin users list, Block/Unblock, ChangeRole, Delete account)
- `EventController` — `/api/events` (actual, list, getById, create, update, delete, image upload/delete, publish/cancel/complete)
- `ParticipationController` — `/api/events/{eventId}/apply`, `/api/participations/*`, `/api/users/me/activities`, `/api/events/{eventId}/participations` etc.
- `AdminController` — `/api/admin` (dashboard, stats, users, participations, news management, events, audit-log, analytics, notifications)
- `NewsController` — `/api/news` (public and admin endpoints, image upload, publish/archive)
- `FeedbackController` — `/api/feedback` (create public feedback, admin read/list)

---

Если нужно, я могу:
- Сгенерировать готовые TypeScript-axios API-клиенты (файлы) по DTO и endpoint-таблице;
- Сформировать OpenAPI/Swagger-расширение (пример конфигурации client generator);
- Экспортировать этот документ в `API/README_API.md` в репозитории (сделаю файл в указанной папке).

Сохранить этот файл как `.md` в репозитории: `API/API_DOCUMENTATION.md` (сделано).

---

Примечание по полноте: документ составлен на основе исходников в репозитории (контроллеры, DTO, enums и настройки `Program.cs` и `appsettings.json`). Если хотите — могу пройтись по каждому DTO-файлу и автоматически сгенерировать полный набор TypeScript-интерфейсов и примеров ответов/тестовых данных.

Если нужно — расширю секции примеров и додам auto-generated TypeScript clients.

