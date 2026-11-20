import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { PhotoField, stagePhoto, type PhotoSelection } from '../../components/PhotoField';
import { useAuth } from '../../context/AuthContext';
import { organizationsApi } from '../../api/organizations';
import { organizerApi } from '../../api/organizer';
import type { OrganizationSummary } from '../../types/organization';
import { adminApi } from '../../api/admin';
import { eventsApi } from '../../api/events';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import type { AdminEventListDto } from '../../types/admin';
import { CATEGORIES } from '../../utils/afisha';
import { eventCategoriesApi, useEventCategories } from '../../utils/eventCategories';
import { fromDatetimeLocal, toDatetimeLocal } from '../../utils/datetimeLocal';
import { SchedulePublicationField } from '../../components/admin/SchedulePublicationField';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: AdminEventListDto | null;
}

/** Ограничения тегов совпадают с серверными (Event.MaxTags / MaxTagLength). */
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

export function EventFormModal({ isOpen, onClose, onSuccess, event }: EventFormModalProps) {
  const { notify } = useNotification();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
    maxParticipants: '',
    category: '',
    tags: [] as string[],
  });

  const [tagsInput, setTagsInput] = useState('');

  // Запланированная публикация черновика (datetime-local); savedPublishAt — что уже сохранено на сервере.
  const [publishAt, setPublishAt] = useState('');
  const [savedPublishAt, setSavedPublishAt] = useState('');
  const canSchedule = !event || event.status === 'Draft';

  // Категории: встроенные и добавленные администратором. Пока список не загрузился, показываем встроенные.
  const categories = useEventCategories();
  const categoryOptions = categories.list.length > 0
    ? categories.list
    : CATEGORIES.map(c => ({ value: c.id as string, label: c.label, builtIn: true }));
  const [categoryInvalid, setCategoryInvalid] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImageCrop, setCurrentImageCrop] = useState<import('../../types/organization').ImageCropDto | null>(null);
  const [photo, setPhoto] = useState<PhotoSelection | null>(null);

  // Организации, от имени которых можно создать мероприятие: администратору — любые, организатору — его собственные.
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [eventOrg, setEventOrg] = useState<OrganizationSummary | null>(null);

  useEffect(() => {
    if (!isOpen || event) return;
    let alive = true;
    const load = isAdmin
      ? organizationsApi.list({ take: 100 }).then(r => r.items.filter(o => o.isActive).map(o => ({
          id: o.id, name: o.name, logoUrl: o.logoUrl, logoThumbnailUrl: o.logoThumbnailUrl, logoCrop: o.logoCrop,
        } as OrganizationSummary)))
      : organizerApi.summary().then(s => s.organizations);
    load.then(list => {
      if (!alive) return;
      setOrgs(list);
      // у организатора одна организация — выбираем её сразу
      setOrganizationId(!isAdmin && list.length === 1 ? list[0].id : '');
    }).catch(() => { if (alive) setOrgs([]); });
    return () => { alive = false; };
  }, [isOpen, event, isAdmin]);

  useEffect(() => {
    let alive = true; // ignore the details response if the modal was closed / switched to another event meanwhile
    if (event && isOpen) {
      // сразу показываем то, что уже есть в списке...
      setFormData({
        title: event.title,
        description: '',
        startsAt: toDatetimeLocal(event.startsAt),
        endsAt: '',
        location: event.location,
        maxParticipants: '',
        category: '',
        tags: [],
      });
      setCurrentImageUrl(null);
      setCurrentImageCrop(null);
      setPhoto(null);
      setEventOrg(null);
      setPublishAt('');
      setSavedPublishAt('');
      setLoadingDetails(true);

      // ...и догружаем полную карточку мероприятия (описание, дата окончания, фото и т.д.)
      eventsApi.getById(event.id)
          .then((full) => {
            if (!alive) return;
            setFormData({
              title: full.title,
              description: full.description,
              startsAt: toDatetimeLocal(full.startsAt),
              endsAt: toDatetimeLocal(full.endsAt),
              location: full.location,
              maxParticipants: full.maxParticipants != null ? String(full.maxParticipants) : '',
              category: full.category || '',
              tags: full.tags ?? [],
            });
            setCurrentImageUrl(full.imageUrl ?? null);
            setCurrentImageCrop(full.imageCrop ?? null);
            setEventOrg(full.organization ?? null);
            const scheduled = toDatetimeLocal(full.scheduledPublishAt);
            setPublishAt(scheduled);
            setSavedPublishAt(scheduled);
          })
          .catch((err) => {
            if (!alive) return;
            console.error('Error loading event details:', err);
            setError('Не удалось загрузить полные данные мероприятия. Проверьте поля перед сохранением.');
          })
          .finally(() => { if (alive) setLoadingDetails(false); });
    } else if (isOpen) {
      setFormData({
        title: '',
        description: '',
        startsAt: '',
        endsAt: '',
        location: '',
        maxParticipants: '',
        category: '',
        tags: [],
      });
      setCurrentImageUrl(null);
      setCurrentImageCrop(null);
      setPhoto(null);
      setOrganizationId('');
      setPublishAt('');
      setSavedPublishAt('');
    }
    setError(null);
    setTagsInput('');
    setCategoryInvalid(false);
    setAddingCategory(false);
    setNewCategory('');
    setCategoryError(null);
    return () => { alive = false; };
  }, [isOpen, event]);

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'category' && value) setCategoryInvalid(false);
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateCategory = async () => {
    const name = newCategory.trim().replace(/\s+/g, ' ');
    if (name.length < 2) {
      setCategoryError('Название категории — не короче 2 символов');
      return;
    }
    setCategoryBusy(true);
    setCategoryError(null);
    try {
      const created = await eventCategoriesApi.create(name);
      setFormData(prev => ({ ...prev, category: created.value }));
      setCategoryInvalid(false);
      setAddingCategory(false);
      setNewCategory('');
      notify(`Категория «${created.label}» добавлена`);
    } catch (err) {
      setCategoryError(adminErrorMessage(err, 'Не удалось добавить категорию. Попробуйте ещё раз.'));
    } finally {
      setCategoryBusy(false);
    }
  };

  /** Теги с учётом набранного, но ещё не добавленного: как на сервере — без ведущего «#», без дублей (регистр не важен), не больше MAX_TAGS. */
  const withTag = (tags: string[], raw: string): string[] => {
    const tag = raw.trim().replace(/^#+/, '').replace(/\s+/g, ' ');
    if (!tag || tags.length >= MAX_TAGS || tags.some(t => t.toLowerCase() === tag.toLowerCase())) return tags;
    return [...tags, tag];
  };

  const handleAddTag = () => {
    setFormData(prev => ({ ...prev, tags: withTag(prev.tags, tagsInput) }));
    setTagsInput('');
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleClose = () => onClose();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        setError('Укажите название мероприятия');
        setLoading(false);
        return;
      }
      if (!formData.description.trim()) {
        setError('Укажите описание мероприятия');
        setLoading(false);
        return;
      }
      if (!formData.startsAt) {
        setError('Укажите дату начала');
        setLoading(false);
        return;
      }
      if (!formData.endsAt) {
        setError('Укажите дату окончания');
        setLoading(false);
        return;
      }
      if (new Date(formData.endsAt) <= new Date(formData.startsAt)) {
        setError('Дата окончания должна быть позже даты начала');
        setLoading(false);
        return;
      }
      if (!formData.location.trim()) {
        setError('Укажите место проведения');
        setLoading(false);
        return;
      }

      if (!formData.category) {
        setCategoryInvalid(true);
        setError('Выберите категорию мероприятия — это обязательное поле');
        setLoading(false);
        return;
      }
      const publishAtIso = canSchedule ? fromDatetimeLocal(publishAt) : null;
      if (canSchedule && publishAt && !publishAtIso) {
        setError('Укажите корректное время публикации');
        setLoading(false);
        return;
      }
      if (publishAtIso && publishAt !== savedPublishAt) {
        if (new Date(publishAtIso) <= new Date()) {
          setError('Время публикации должно быть в будущем');
          setLoading(false);
          return;
        }
        if (new Date(publishAtIso) >= new Date(formData.endsAt)) {
          setError('Публикация должна быть запланирована раньше окончания мероприятия');
          setLoading(false);
          return;
        }
      }

      if (!event && !isAdmin && orgs.length === 0) {
        setError('Вы не состоите ни в одной организации в роли организатора. Обратитесь к администратору.');
        setLoading(false);
        return;
      }
      if (!event && !isAdmin && !organizationId) {
        setError('Выберите организацию, от имени которой проводится мероприятие');
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        location: formData.location,
        ...(formData.maxParticipants && { maxParticipants: parseInt(formData.maxParticipants) }),
        category: formData.category,
        // Всегда отправляем список: пустой при редактировании очищает теги.
        // Тег, который набран, но не добавлен Enter'ом, не теряется при сохранении.
        tags: withTag(formData.tags, tagsInput),
      };

      if (event) {
        await adminApi.updateEvent(event.id, payload);
        // Расписание публикации черновика: меняем только если оно изменилось.
        if (canSchedule && publishAt !== savedPublishAt) {
          if (publishAtIso) await adminApi.scheduleEvent(event.id, publishAtIso);
          else await adminApi.unscheduleEvent(event.id);
        }
        // Фото: новый файл, только кадр или удаление — тем, что нужно, без повторной отправки неизменённого.
        if (photo?.file) {
          await adminApi.uploadEventImage(event.id, photo.file, photo.crop);
        } else if (photo?.removed) {
          await adminApi.deleteEventImage(event.id);
        } else if (photo?.crop && currentImageUrl) {
          await adminApi.setEventImageCrop(event.id, photo.crop);
        } else if (photo?.cropReset && currentImageUrl) {
          await adminApi.resetEventImageCrop(event.id);
        }
        notify('Мероприятие обновлено');
      } else {
        // Новое мероприятие: фото загружается заранее и привязывается при создании — идентификатор для этого не нужен.
        const staged = await stagePhoto(photo);
        await adminApi.createEvent({
          ...payload,
          ...(organizationId && { organizationId }),
          ...(staged && { imageId: staged.imageId, imageCrop: staged.crop }),
          ...(publishAtIso && { publishAt: publishAtIso }),
        });
        notify(publishAtIso ? 'Мероприятие создано и будет опубликовано в назначенное время' : 'Мероприятие создано');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error:', err);
      setError(adminErrorMessage(err, 'Не удалось сохранить мероприятие. Проверьте данные и попробуйте ещё раз.'));
    } finally {
      setLoading(false);
    }
  };

  return (
      <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title={event ? 'Редактировать мероприятие' : 'Создать новое мероприятие'}
          maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
              <div className="p-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg text-sm">
                {error}
              </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
              Название <span className="text-danger-700">*</span>
            </label>
            <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Название мероприятия"
                className="w-full px-3 py-2 text-sm"
                required
            />
          </div>

          {!event && (
            <div>
              <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                Организация {!isAdmin && <span className="text-danger-700">*</span>}
              </label>
              <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="w-full px-3 py-2 text-sm">
                <option value="">{isAdmin ? 'От платформы (без организации)' : 'Выберите организацию'}</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              {!isAdmin && orgs.length === 0 && (
                <p className="text-xs text-warning-700 mt-1">Вы не состоите ни в одной организации как организатор — обратитесь к администратору.</p>
              )}
            </div>
          )}
          {event && eventOrg && (
            <p className="text-[13px] text-ink-400">Организация: <span className="text-ink-700">{eventOrg.name}</span></p>
          )}

          <PhotoField
              purpose="event"
              label="Фото мероприятия"
              selection={photo}
              onChange={(value) => { setPhoto(value); }}
              existingUrl={currentImageUrl}
              existingCrop={currentImageCrop}
              disabled={loadingDetails || (!!event && (event.status === 'Cancelled' || event.status === 'Completed'))}
              hint="Фото можно выбрать сразу — сохранять мероприятие для этого не нужно"
          />

          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
              Описание <span className="text-danger-700">*</span>
            </label>
            <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Подробное описание мероприятия"
                rows={4}
                className="w-full bg-surface-2 border border-line-strong rounded-lg px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500 resize-none"
                required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
              Место <span className="text-danger-700">*</span>
            </label>
            <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Адрес или описание места"
                className="w-full px-3 py-2 text-sm"
                required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                Начало <span className="text-danger-700">*</span>
              </label>
              <input
                  type="datetime-local"
                  name="startsAt"
                  value={formData.startsAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm"
                  required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                Окончание <span className="text-danger-700">*</span>
              </label>
              <input
                  type="datetime-local"
                  name="endsAt"
                  value={formData.endsAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm"
                  required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
                Макс. участников
              </label>
              <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  placeholder="Не ограничено"
                  min="1"
                  className="w-full px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="event-category" className="block text-[13px] font-medium text-ink-700 mb-1.5">
                Категория <span className="text-danger-700">*</span>
              </label>
              <div className="flex gap-2">
                <select
                    id="event-category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={categoryInvalid}
                    aria-describedby={categoryInvalid ? 'event-category-error' : undefined}
                    className={`w-full px-3 py-2 text-sm ${categoryInvalid ? '!border-danger-600 ring-1 ring-danger-600' : ''}`}
                >
                  <option value="">Выберите категорию</option>
                  {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {isAdmin && (
                  <button
                      type="button"
                      onClick={() => { setAddingCategory(v => !v); setCategoryError(null); }}
                      aria-expanded={addingCategory}
                      title="Добавить свою категорию"
                      aria-label="Добавить свою категорию"
                      className="btn btn-secondary shrink-0 !px-3"
                  >
                    <i className="fas fa-plus" />
                  </button>
                )}
              </div>
              {categoryInvalid && <p id="event-category-error" className="text-xs text-danger-700 mt-1">Выберите категорию из списка</p>}
              {addingCategory && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCategory}
                        maxLength={40}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateCategory(); } }}
                        placeholder="Название новой категории"
                        aria-label="Название новой категории"
                        className="flex-1 px-3 py-2 text-sm"
                        autoFocus
                    />
                    <button type="button" onClick={() => void handleCreateCategory()} disabled={categoryBusy} className="btn btn-primary shrink-0">
                      {categoryBusy && <Spinner />}Добавить
                    </button>
                  </div>
                  {categoryError && <p className="text-xs text-danger-700">{categoryError}</p>}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1.5">Теги</label>
            <div className="flex gap-2 mb-2">
              <input
                  type="text"
                  value={tagsInput}
                  maxLength={MAX_TAG_LENGTH}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter (и запятая) добавляют тег; пока идёт ввод через IME, Enter подтверждает слово, а не тег.
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Введите тег и нажмите Enter"
                  aria-label="Новый тег"
                  className="flex-1 bg-surface-2 border border-line-strong rounded-lg px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500"
              />
              <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn btn-primary"
              >
                +
              </button>
            </div>
            {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                      <div
                          key={idx}
                          className="flex items-center gap-2 bg-brand-100 text-brand-700 px-2 py-1 rounded-full text-sm"
                      >
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={() => handleRemoveTag(idx)}
                            className="hover:text-danger-700 transition"
                        >
                          ✕
                        </button>
                      </div>
                  ))}
                </div>
            )}
          </div>

          {canSchedule && (
            <SchedulePublicationField value={publishAt} onChange={setPublishAt} subject="Мероприятие" disabled={loading || loadingDetails} />
          )}

          <div className="flex gap-2 pt-4">
            <button
                type="submit"
                disabled={loading || loadingDetails}
                className="btn btn-primary flex-1"
            >
              {loading && <Spinner />}
              {event ? 'Сохранить изменения' : 'Создать мероприятие'}
            </button>
            <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary flex-1"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>
  );
}