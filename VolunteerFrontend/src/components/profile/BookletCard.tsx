import { useCallback, useEffect, useState } from 'react';
import { bookletApi } from '../../api/booklet';
import { BOOKLET_TEXT_DEFAULT as D } from '../../content/defaults';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useSiteJson, useSiteText } from '../../context/SiteContentContext';
import { mapApiError } from '../../utils/apiError';
import { checkPhone, PHONE_HINT, PHONE_PLACEHOLDER } from '../../utils/phone';
import type { BookletState } from '../../types/booklet';
import { Modal } from '../Modal';
import { PhotoField, type PhotoSelection } from '../PhotoField';
import { Button } from '../ui/Button';

/**
 * Окно «Добровольческая книжка» в профиле. Пока человек не подал заявку, это приглашение: «Узнать подробнее» открывает
 * описание (что даёт книжка, какие данные собираются, как получить) и кнопку «Заполнить форму». После заявки приглашение
 * пропадает, остаётся одна строка статуса; когда книжка выдана — её номер. Тексты правятся в «Тексты сайта».
 */
export function BookletCard() {
  const [state, setState] = useState<BookletState | null>(null);
  const [info, setInfo] = useState(false);
  const [form, setForm] = useState(false);

  const load = useCallback(async () => {
    try { setState(await bookletApi.state()); }
    catch { setState(null); /* окно необязательно: при сбое профиль работает без него */ }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const title = useSiteText('booklet.title', D.title);
  const teaser = useSiteText('booklet.teaser', D.teaser);

  if (!state) return null;
  const { booklet, request } = state;

  if (booklet) {
    return (
      <div className="rounded-card border border-vol-line bg-vol-bg p-4 flex items-start gap-3" data-testid="booklet-issued">
        <i className="fas fa-id-card mt-1 text-primary" aria-hidden />
        <div className="min-w-0">
          <p className="text-ctrl font-semibold text-vol-fg">Ваша добровольческая книжка: <span className="mono">{booklet.label}</span></p>
          <p className="vol-meta">
            {booklet.lastName} {booklet.firstName} {booklet.middleName ?? ''}, {booklet.birthYear} г.р.
            {booklet.issuedAt ? ` Выдана ${new Date(booklet.issuedAt).toLocaleDateString('ru-RU')}.` : ' Бумажную книжку можно забрать, предъявив удостоверение личности.'}
          </p>
        </div>
      </div>
    );
  }

  if (request && !state.canRequest) {
    return (
      <div className="rounded-card border border-vol-line bg-vol-bg p-4 flex items-start gap-3" data-testid="booklet-pending">
        <i className="fas fa-hourglass-half mt-1 text-amber-600" aria-hidden />
        <div>
          <p className="text-ctrl font-semibold text-vol-fg">Заявка на добровольческую книжку отправлена</p>
          <p className="vol-meta">Администратор рассмотрит её и свяжется с вами по телефону {request.phone}. Если в данных ошибка, не отправляйте форму ещё раз: позвоните или напишите нам (контакты на странице «О нас»).</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-card border border-primary/30 bg-vol-accent-soft p-4 sm:p-5" data-testid="booklet-invite">
        <div className="flex items-start gap-3">
          <i className="fas fa-id-card mt-1 text-primary text-lg" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-ctrl font-semibold text-vol-fg">{title}</h2>
            <p className="vol-text-sm mt-1">{teaser}</p>
            {request?.status === 'Rejected' && (
              <p className="mt-2 rounded-control border border-amber-200 bg-amber-50 px-3 py-2 text-meta text-amber-800" role="status">
                Прошлая заявка не принята{request.adminNote ? `: ${request.adminNote}` : '.'} Проверьте данные и отправьте форму снова.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setInfo(true)}>Узнать подробнее об оформлении</Button>
              <Button size="sm" onClick={() => setForm(true)}>Заполнить форму</Button>
            </div>
          </div>
        </div>
      </div>

      {info && <BookletInfoModal onClose={() => setInfo(false)} onFill={() => { setInfo(false); setForm(true); }} />}
      {form && <BookletFormModal onClose={() => setForm(false)} onSent={() => { setForm(false); void load(); }} />}
    </>
  );
}

function BookletInfoModal({ onClose, onFill }: { onClose: () => void; onFill: () => void }) {
  const title = useSiteText('booklet.title', D.title);
  const intro = useSiteText('booklet.intro', D.intro);
  const benefitsTitle = useSiteText('booklet.benefits.title', D.benefitsTitle);
  const benefits = useSiteJson<string[]>('booklet.benefits', D.benefits);
  const dataTitle = useSiteText('booklet.data.title', D.dataTitle);
  const data = useSiteJson<string[]>('booklet.data', D.data);
  const howTitle = useSiteText('booklet.how.title', D.howTitle);
  const how = useSiteText('booklet.how', D.how);

  return (
    <Modal isOpen onClose={onClose} title={title} maxWidth="max-w-xl">
      <div className="space-y-5 text-sm text-gray-700">
        <p>{intro}</p>
        <section aria-labelledby="bk-benefits">
          <h3 id="bk-benefits" className="font-semibold text-gray-900 mb-1.5">{benefitsTitle}</h3>
          <ul className="list-disc pl-5 space-y-1">{benefits.map(b => <li key={b}>{b}</li>)}</ul>
        </section>
        <section aria-labelledby="bk-data">
          <h3 id="bk-data" className="font-semibold text-gray-900 mb-1.5">{dataTitle}</h3>
          <ul className="list-disc pl-5 space-y-1">{data.map(b => <li key={b}>{b}</li>)}</ul>
        </section>
        <section aria-labelledby="bk-how">
          <h3 id="bk-how" className="font-semibold text-gray-900 mb-1.5">{howTitle}</h3>
          <p>{how}</p>
        </section>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Закрыть</Button>
          <Button onClick={onFill}>Заполнить форму</Button>
        </div>
      </div>
    </Modal>
  );
}

function BookletFormModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { user } = useAuth();
  const { notify } = useNotification();
  const photoHint = useSiteText('booklet.photo-hint', D.photoHint);
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [middleName, setMiddleName] = useState(user?.middleName ?? '');
  const [birthYear, setBirthYear] = useState(user?.birthYear ? String(user.birthYear) : '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<PhotoSelection | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!lastName.trim()) return 'Укажите фамилию.';
    if (!firstName.trim()) return 'Укажите имя.';
    const year = Number(birthYear);
    if (!/^\d{4}$/.test(birthYear.trim()) || year < 1900 || year > new Date().getFullYear()) return 'Укажите год рождения четырьмя цифрами, например 2005.';
    const checked = checkPhone(phone);
    if (!checked.ok) return `Телефон: ${checked.error}`;
    if (!checked.value) return 'Укажите телефон: по нему вам перезвонят и уточнят данные.';
    if (!agree) return 'Нужно согласие на обработку этих данных для оформления книжки.';
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    const checked = checkPhone(phone);
    setError(null);
    setBusy(true);
    try {
      await bookletApi.submit({
        lastName: lastName.trim(), firstName: firstName.trim(), middleName: middleName.trim() || undefined,
        birthYear: Number(birthYear), phone: checked.ok ? checked.value : phone, comment: comment.trim() || undefined,
        photo: photo?.file ?? null, crop: photo?.crop ?? null,
      });
      notify('Заявка отправлена. Администратор свяжется с вами по телефону.');
      onSent();
    } catch (err) {
      setError(mapApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const inp = 'w-full h-11 px-3.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <Modal isOpen onClose={onClose} title="Заявка на добровольческую книжку" maxWidth="max-w-xl">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <div role="alert" className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>}
        <p className="text-sm text-gray-600">Данные, как они напишутся в книжке. Номер, дату выдачи, подпись и печать проставляет администратор.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className={lbl} htmlFor="bk-last">Фамилия *</label><input id="bk-last" value={lastName} onChange={e => setLastName(e.target.value)} maxLength={100} className={inp} autoComplete="family-name" /></div>
          <div><label className={lbl} htmlFor="bk-first">Имя *</label><input id="bk-first" value={firstName} onChange={e => setFirstName(e.target.value)} maxLength={100} className={inp} autoComplete="given-name" /></div>
          <div><label className={lbl} htmlFor="bk-middle">Отчество</label><input id="bk-middle" value={middleName} onChange={e => setMiddleName(e.target.value)} maxLength={100} className={inp} autoComplete="additional-name" /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className={lbl} htmlFor="bk-year">Год рождения *</label><input id="bk-year" inputMode="numeric" value={birthYear} onChange={e => setBirthYear(e.target.value)} maxLength={4} placeholder="2005" className={inp} /></div>
          <div>
            <label className={lbl} htmlFor="bk-phone">Телефон *</label>
            <input id="bk-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={32} placeholder={PHONE_PLACEHOLDER} aria-describedby="bk-phone-hint" className={inp} />
            <p id="bk-phone-hint" className="text-xs text-gray-500 mt-1">{PHONE_HINT} Вам позвонят, если в данных ошибка.</p>
          </div>
        </div>
        <div>
          <label className={lbl} htmlFor="bk-comment">Комментарий</label>
          <textarea id="bk-comment" value={comment} onChange={e => setComment(e.target.value)} rows={2} maxLength={1000} className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/40 outline-none resize-none" />
        </div>
        <PhotoField purpose="booklet" label="Фото (необязательно)" selection={photo} onChange={setPhoto} disabled={busy} hint={photoHint} />
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-1" />
          <span>Согласен на обработку этих данных (фамилия, имя, отчество, год рождения, телефон, фото) для оформления добровольческой книжки.</span>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Отмена</Button>
          <Button type="submit" loading={busy}>Отправить заявку</Button>
        </div>
      </form>
    </Modal>
  );
}
