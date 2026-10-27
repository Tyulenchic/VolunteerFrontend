import { useState } from 'react';
import { organizationsApi } from '../../api/organizations';
import { PhotoField, stagePhoto, type PhotoSelection } from '../PhotoField';
import { Button } from '../ui/Button';
import { adminErrorMessage } from '../../utils/adminErrors';
import { checkPhone, PHONE_HINT, PHONE_PLACEHOLDER } from '../../utils/phone';
import {
  ALL_CATEGORIES, ALL_DIRECTIONS, ALL_LEVELS, CATEGORY_LABEL, DIRECTION_LABEL, LEVEL_LABEL,
  type MovementDirection, type MovementInput, type OrganizationCategory, type OrganizationDetails, type OrganizationLevel,
} from '../../types/organization';

const CITIES = ['Тирасполь', 'Бендеры', 'Рыбница', 'Дубоссары', 'Слободзея', 'Григориополь', 'Каменка'];
const MAX_MOVEMENTS = 20;

interface Props {
  /** Редактируемая организация; без неё — создание (только администратор). */
  initial?: OrganizationDetails | null;
  onSaved: (org: OrganizationDetails) => void;
  onCancel?: () => void;
}

/** Нормализованный номер («+37377712345») или null; формат уже проверен в validate(). */
const phoneValue = (raw: string | null | undefined): string | null => {
  const r = checkPhone(raw);
  return r.ok && r.value ? r.value : null;
};

const emptyMovement = (): MovementInput => ({ name: '', directions: [], leaderName: '', phone: '', email: '' });
const isEmail = (v: string) => /^\S+@\S+$/.test(v);
const isHttp = (v: string) => { try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };

/**
 * Форма организации: название и описание, тип и направления, контакты, волонтёрские движения, логотип и обложка.
 * Используется администратором (создание/изменение) и организатором (изменение своей организации).
 * Фото выбираются сразу и отправляются при сохранении — для новой организации тоже, без «сначала сохраните».
 */
export function OrganizationForm({ initial, onSaved, onCancel }: Props) {
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [shortName, setShortName] = useState(initial?.shortName ?? '');
  const [level, setLevel] = useState<OrganizationLevel>(initial?.level ?? 'School');
  const [categories, setCategories] = useState<OrganizationCategory[]>(initial?.categories ?? []);
  const [city, setCity] = useState(initial?.city ?? '');
  const [phone, setPhone] = useState(initial?.contactPhone ?? '');
  const [email, setEmail] = useState(initial?.contactEmail ?? '');
  const [website, setWebsite] = useState(initial?.website ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [movements, setMovements] = useState<MovementInput[]>(
    initial?.movements.map(m => ({ name: m.name, directions: m.directions, leaderName: m.leaderName, phone: m.phone ?? '', email: m.email ?? '' })) ?? [],
  );
  const [logo, setLogo] = useState<PhotoSelection | null>(null);
  const [cover, setCover] = useState<PhotoSelection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  const patchMovement = (i: number, patch: Partial<MovementInput>) =>
    setMovements(list => list.map((m, k) => (k === i ? { ...m, ...patch } : m)));

  const validate = (): string | null => {
    if (!name.trim()) return 'Укажите название организации';
    if (!description.trim()) return 'Добавьте описание организации';
    if (email.trim() && !isEmail(email.trim())) return 'Контактный email указан неверно';
    if (website.trim() && !isHttp(website.trim())) return 'Адрес сайта должен начинаться с http:// или https://';
    const orgPhone = checkPhone(phone);
    if (!orgPhone.ok) return `Телефон организации: ${orgPhone.error}`;
    for (const [i, m] of movements.entries()) {
      if (!m.name.trim()) return `Движение ${i + 1}: укажите название`;
      if (!m.leaderName.trim()) return `Движение ${i + 1}: укажите руководителя`;
      const movementPhone = checkPhone(m.phone);
      if (!movementPhone.ok) return `Движение ${i + 1}: ${movementPhone.error}`;
      if (m.email && m.email.trim() && !isEmail(m.email.trim())) return `Движение ${i + 1}: email указан неверно`;
    }
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError(null);
    setBusy(true);

    const base = {
      name: name.trim(), description: description.trim(),
      city: city.trim() || null, contactEmail: email.trim() || null, website: website.trim() || null,
      shortName: shortName.trim() || null, level, categories, contactPhone: phoneValue(phone),
      movements: movements.map(m => ({ ...m, name: m.name.trim(), leaderName: m.leaderName.trim(), phone: phoneValue(m.phone), email: m.email?.trim() || null })),
    };

    try {
      let saved: OrganizationDetails;
      if (initial) {
        saved = await organizationsApi.update(initial.id, base);
        // Логотип и обложка: новый файл, только кадр или удаление.
        for (const [kind, sel, existing] of [['logo', logo, initial.logoUrl], ['cover', cover, initial.coverUrl]] as const) {
          if (sel?.file) {
            const staged = await stagePhoto(sel);
            if (staged) saved = await organizationsApi.setImage(initial.id, kind, staged.imageId, staged.crop);
          } else if (sel?.removed) {
            saved = await organizationsApi.clearImage(initial.id, kind);
          } else if (sel?.crop && existing) {
            saved = await organizationsApi.setImageCrop(initial.id, kind, sel.crop);
          }
        }
      } else {
        const [stagedLogo, stagedCover] = [await stagePhoto(logo), await stagePhoto(cover)];
        saved = await organizationsApi.create({
          ...base,
          ...(stagedLogo && { logoImageId: stagedLogo.imageId, logoCrop: stagedLogo.crop }),
          ...(stagedCover && { coverImageId: stagedCover.imageId, coverCrop: stagedCover.crop }),
        });
      }
      onSaved(saved);
    } catch (err) {
      setError(adminErrorMessage(err, 'Не удалось сохранить организацию. Проверьте данные и попробуйте ещё раз.'));
    } finally {
      setBusy(false);
    }
  };

  const label = 'block text-[13px] font-medium text-ink-700 mb-1.5';
  const chip = (on: boolean) =>
    `px-3 py-1.5 rounded-full text-[13px] border transition ${on ? 'bg-brand-600 text-white border-brand-600' : 'border-line-strong text-ink-500 hover:bg-surface-3'}`;

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <div role="alert" className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg text-sm">{error}</div>}

      <div className="grid sm:grid-cols-2 gap-5">
        <PhotoField purpose="orgLogo" label="Логотип" selection={logo} onChange={setLogo}
          existingUrl={initial?.logoUrl} existingCrop={initial?.logoCrop} disabled={busy} />
        <PhotoField purpose="orgCover" label="Обложка страницы" selection={cover} onChange={setCover}
          existingUrl={initial?.coverUrl} existingCrop={initial?.coverCrop} disabled={busy} />
      </div>

      <div>
        <label className={label} htmlFor="org-name">Полное название <span className="text-danger-700">*</span></label>
        <input id="org-name" value={name} onChange={e => setName(e.target.value)} maxLength={150} className="w-full px-3 py-2 text-sm" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="org-short">Короткое название</label>
          <input id="org-short" value={shortName} onChange={e => setShortName(e.target.value)} maxLength={100} placeholder="Для карточек и заголовков" className="w-full px-3 py-2 text-sm" />
        </div>
        <div>
          <label className={label} htmlFor="org-level">Тип организации</label>
          <select id="org-level" value={level} onChange={e => setLevel(e.target.value as OrganizationLevel)} className="w-full px-3 py-2 text-sm">
            {ALL_LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
          </select>
        </div>
      </div>

      <div>
        <span className={label}>Направления деятельности</span>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(c => (
            <button key={c} type="button" aria-pressed={categories.includes(c)} onClick={() => setCategories(toggle(categories, c))} className={chip(categories.includes(c))}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={label} htmlFor="org-desc">Описание <span className="text-danger-700">*</span></label>
        <textarea id="org-desc" value={description} onChange={e => setDescription(e.target.value)} rows={5} maxLength={4000}
          className="w-full px-3 py-2 text-sm bg-surface-2 border border-line-strong rounded-lg" required />
        <p className="text-xs text-ink-400 mt-1">{description.length}/4000</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="org-city">Город</label>
          <input id="org-city" list="org-cities" value={city} onChange={e => setCity(e.target.value)} maxLength={100} className="w-full px-3 py-2 text-sm" />
          <datalist id="org-cities">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className={label} htmlFor="org-phone">Телефон</label>
          <input id="org-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={32} placeholder={PHONE_PLACEHOLDER} autoComplete="off"
            aria-describedby="org-phone-hint" className="w-full px-3 py-2 text-sm" />
          <p id="org-phone-hint" className="text-xs text-ink-400 mt-1">{PHONE_HINT}</p>
        </div>
        <div>
          <label className={label} htmlFor="org-email">Email</label>
          <input id="org-email" type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} className="w-full px-3 py-2 text-sm" />
        </div>
        <div>
          <label className={label} htmlFor="org-site">Сайт</label>
          <input id="org-site" value={website} onChange={e => setWebsite(e.target.value)} maxLength={300} placeholder="https://" className="w-full px-3 py-2 text-sm" />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className={label}>Волонтёрские движения</legend>
        {movements.map((m, i) => (
          <div key={i} className="border border-line rounded-lg p-3 space-y-3 bg-surface-3/40">
            <div className="flex gap-2">
              <input value={m.name} onChange={e => patchMovement(i, { name: e.target.value })} placeholder="Название движения" aria-label={`Движение ${i + 1}: название`} maxLength={200} className="flex-1 px-3 py-2 text-sm" />
              <button type="button" className="icon-btn is-danger" aria-label={`Удалить движение ${i + 1}`} onClick={() => setMovements(list => list.filter((_, k) => k !== i))}><i className="fas fa-trash" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DIRECTIONS.map((d: MovementDirection) => (
                <button key={d} type="button" aria-pressed={m.directions.includes(d)} onClick={() => patchMovement(i, { directions: toggle(m.directions, d) })}
                  className={`px-2.5 py-1 rounded-full text-xs border transition ${m.directions.includes(d) ? 'bg-brand-100 text-brand-700 border-brand-500' : 'border-line text-ink-400 hover:bg-surface-3'}`}>
                  {DIRECTION_LABEL[d]}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              <input value={m.leaderName} onChange={e => patchMovement(i, { leaderName: e.target.value })} placeholder="Руководитель" aria-label={`Движение ${i + 1}: руководитель`} maxLength={300} className="px-3 py-2 text-sm" />
              <input value={m.phone ?? ''} onChange={e => patchMovement(i, { phone: e.target.value })} type="tel" maxLength={32} placeholder="Телефон, +373 777 12345" aria-label={`Движение ${i + 1}: телефон`} className="px-3 py-2 text-sm" />
              <input value={m.email ?? ''} onChange={e => patchMovement(i, { email: e.target.value })} placeholder="Email" aria-label={`Движение ${i + 1}: email`} maxLength={254} className="px-3 py-2 text-sm" />
            </div>
          </div>
        ))}
        {movements.length < MAX_MOVEMENTS && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setMovements(list => [...list, emptyMovement()])}>
            <i className="fas fa-plus" aria-hidden /> Добавить движение
          </Button>
        )}
      </fieldset>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={busy} className="flex-1">{editing ? 'Сохранить изменения' : 'Создать организацию'}</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel} className="flex-1" disabled={busy}>Отмена</Button>}
      </div>
    </form>
  );
}
