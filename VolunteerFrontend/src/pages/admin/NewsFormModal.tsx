import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { PhotoField, stagePhoto, type PhotoSelection } from '../../components/PhotoField';
import { adminApi } from '../../api/admin';
import { newsApi } from '../../api/news';
import { useNotification } from '../../context/NotificationContext';
import { adminErrorMessage } from '../../utils/adminErrors';
import type { AdminNewsListDto } from '../../types/admin';

interface NewsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  news?: AdminNewsListDto | null;
}

export function NewsFormModal({ isOpen, onClose, onSuccess, news }: NewsFormModalProps) {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
  });

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImageCrop, setCurrentImageCrop] = useState<import('../../types/organization').ImageCropDto | null>(null);
  const [photo, setPhoto] = useState<PhotoSelection | null>(null);

  useEffect(() => {
    let alive = true; // ignore the details response if the modal was closed / switched to another item meanwhile
    if (news && isOpen) {
      // сразу показываем то, что уже есть в списке...
      setFormData({
        title: news.title,
        content: '',
        excerpt: '',
        category: '',
      });
      setCurrentImageUrl(news.coverImageUrl || null);
      setCurrentImageCrop(null);
      setPhoto(null);
      setLoadingDetails(true);

      // ...и догружаем полную новость (текст, описание, категорию, обложку)
      newsApi.getById(news.id)
          .then((full) => {
            if (!alive) return;
            setFormData({
              title: full.title,
              content: full.content,
              excerpt: full.summary || full.excerpt || '',
              category: full.category || '',
            });
            setCurrentImageUrl(full.imageUrl || null);
            setCurrentImageCrop(full.imageCrop ?? null);
          })
          .catch((err) => {
            if (!alive) return;
            console.error('Error loading news details:', err);
            setError('Не удалось загрузить полные данные новости. Проверьте поля перед сохранением.');
          })
          .finally(() => { if (alive) setLoadingDetails(false); });
    } else if (isOpen) {
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: '',
      });
      setCurrentImageUrl(null);
      setCurrentImageCrop(null);
      setPhoto(null);
    }
    setError(null);
    return () => { alive = false; };
  }, [isOpen, news]);

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => onClose();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        setError('Укажите заголовок новости');
        setLoading(false);
        return;
      }
      if (!formData.content.trim()) {
        setError('Укажите содержание новости');
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        // на сервере поле называется summary
        ...(formData.excerpt && { summary: formData.excerpt }),
        ...(formData.category && { category: formData.category }),
      };

      if (news) {
        await adminApi.updateNews(news.id, payload);
        // Обложка: новый файл, только кадр или удаление.
        if (photo?.file) {
          await adminApi.uploadNewsImage(news.id, photo.file, photo.crop);
        } else if (photo?.removed) {
          await adminApi.deleteNewsImage(news.id);
        } else if (photo?.crop && currentImageUrl) {
          await adminApi.setNewsImageCrop(news.id, photo.crop);
        }
        notify('Новость обновлена');
      } else {
        // Новая новость: обложка загружается заранее и привязывается при создании — идентификатор для этого не нужен.
        const staged = await stagePhoto(photo);
        await adminApi.createNews({ ...payload, ...(staged && { imageId: staged.imageId, imageCrop: staged.crop }) });
        notify('Новость создана');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      setError(adminErrorMessage(err, 'Не удалось сохранить новость. Проверьте данные и попробуйте ещё раз.'));
    } finally {
      setLoading(false);
    }
  };

  return (
      <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title={news ? 'Редактировать новость' : 'Создать новость'}
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
              Заголовок <span className="text-danger-700">*</span>
            </label>
            <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Заголовок новости"
                className="w-full px-3 py-2 text-sm"
                required
            />
          </div>

          <PhotoField
              purpose="news"
              label="Обложка новости"
              selection={photo}
              onChange={setPhoto}
              existingUrl={currentImageUrl}
              existingCrop={currentImageCrop}
              disabled={loadingDetails}
              hint="Обложку можно выбрать сразу — сохранять новость для этого не нужно"
          />

          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
              Краткое описание
            </label>
            <input
                type="text"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Краткое резюме (для списков)"
                maxLength={160}
                className="w-full px-3 py-2 text-sm"
            />
            <p className="text-xs text-ink-400 mt-1">{formData.excerpt.length}/160</p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
              Содержание <span className="text-danger-700">*</span>
            </label>
            <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Полное содержание новости"
                rows={6}
                className="w-full bg-surface-2 border border-line-strong rounded-lg px-3 py-2 text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500 resize-none"
                required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1.5">
              Категория
            </label>
            <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Например: Полезные советы, Обновления и т.д."
                className="w-full px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
                type="submit"
                disabled={loading || loadingDetails}
                className="btn btn-primary flex-1"
            >
              {loading && <Spinner />}
              {news ? 'Сохранить изменения' : 'Создать новость'}
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