import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { ImageUploadField } from '../../components/ImageUploadField';
import { adminApi } from '../../api/admin';
import { eventsApi } from '../../api/events';
import { useNotification } from '../../context/NotificationContext';
import type { AdminEventListDto } from '../../types/admin';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: AdminEventListDto | null;
}

const toDatetimeLocal = (iso: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function EventFormModal({ isOpen, onClose, onSuccess, event }: EventFormModalProps) {
  const { notify } = useNotification();
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
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
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
      setImageChanged(false);
      setLoadingDetails(true);

      // ...и догружаем полную карточку мероприятия (описание, дата окончания, фото и т.д.)
      eventsApi.getById(event.id)
          .then((full) => {
            setFormData({
              title: full.title,
              description: full.description,
              startsAt: toDatetimeLocal(full.startsAt),
              endsAt: toDatetimeLocal(full.endsAt),
              location: full.location,
              maxParticipants: full.maxParticipants != null ? String(full.maxParticipants) : '',
              category: full.category || '',
              tags: [],
            });
            setCurrentImageUrl(full.imageUrl ?? null);
          })
          .catch((err) => {
            console.error('Error loading event details:', err);
            setError('Не удалось загрузить полные данные мероприятия. Проверьте поля перед сохранением.');
          })
          .finally(() => setLoadingDetails(false));
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
      setImageChanged(false);
    }
    setError(null);
    setTagsInput('');
  }, [isOpen, event]);

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagsInput.trim()],
      }));
      setTagsInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleClose = () => {
    // если фото меняли, но "Сохранить" не нажимали — всё равно обновим список
    if (imageChanged) {
      onSuccess();
    }
    onClose();
  };

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

      const payload = {
        title: formData.title,
        description: formData.description,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        location: formData.location,
        ...(formData.maxParticipants && { maxParticipants: parseInt(formData.maxParticipants) }),
        ...(formData.category && { category: formData.category }),
        ...(formData.tags.length > 0 && { tags: formData.tags }),
      };

      if (event) {
        await adminApi.updateEvent(event.id, payload);
        notify('Мероприятие обновлено');
      } else {
        await adminApi.createEvent(payload);
        notify('Мероприятие создано');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Ошибка при сохранении мероприятия');
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
              <div className="p-3 bg-red-900/40 text-red-400 border border-red-800 rounded-lg text-sm">
                {error}
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Название <span className="text-red-400">*</span>
            </label>
            <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Название мероприятия"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                required
            />
          </div>

          <ImageUploadField
              label="Фото мероприятия"
              currentImageUrl={currentImageUrl}
              disabled={!event || loadingDetails}
              disabledHint="Сначала сохраните мероприятие, затем откройте его снова, чтобы добавить фото"
              onUpload={async (file) => {
                const updated = await adminApi.uploadEventImage(event!.id, file);
                setCurrentImageUrl(updated.imageUrl ?? null);
                setImageChanged(true);
                notify('Фото мероприятия обновлено');
              }}
              onDelete={async () => {
                await adminApi.deleteEventImage(event!.id);
                setCurrentImageUrl(null);
                setImageChanged(true);
                notify('Фото мероприятия удалено');
              }}
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Описание <span className="text-red-400">*</span>
            </label>
            <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Подробное описание мероприятия"
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Место <span className="text-red-400">*</span>
            </label>
            <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Адрес или описание места"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Начало <span className="text-red-400">*</span>
              </label>
              <input
                  type="datetime-local"
                  name="startsAt"
                  value={formData.startsAt}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Окончание <span className="text-red-400">*</span>
              </label>
              <input
                  type="datetime-local"
                  name="endsAt"
                  value={formData.endsAt}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Макс. участников
              </label>
              <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  placeholder="Не ограничено"
                  min="1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Категория
              </label>
              <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
              >
                <option value="">Выберите категорию</option>
                <option value="Veterans">Ветераны</option>
                <option value="Medical">Медицина</option>
                <option value="Donation">Донорство</option>
                <option value="Animals">Животные</option>
                <option value="HealthyLife">Здоровый образ жизни</option>
                <option value="Culture">Культура</option>
                <option value="Education">Образование</option>
                <option value="Media">Медиа</option>
                <option value="Social">Социальное</option>
                <option value="Events">События</option>
                <option value="Patriotic">Патриотизм</option>
                <option value="Urban">Город</option>
                <option value="Ecological">Экология</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Теги</label>
            <div className="flex gap-2 mb-2">
              <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Введите тег и нажмите Enter"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
              <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
              >
                +
              </button>
            </div>
            {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                      <div
                          key={idx}
                          className="flex items-center gap-2 bg-primary/20 text-primary px-2 py-1 rounded-full text-sm"
                      >
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={() => handleRemoveTag(idx)}
                            className="hover:text-red-400 transition"
                        >
                          ✕
                        </button>
                      </div>
                  ))}
                </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
                type="submit"
                disabled={loading || loadingDetails}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading && <Spinner />}
              {event ? 'Сохранить изменения' : 'Создать мероприятие'}
            </button>
            <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>
  );
}