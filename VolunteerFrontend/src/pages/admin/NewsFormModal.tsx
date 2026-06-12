import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { ImageUploadField } from '../../components/ImageUploadField';
import { adminApi } from '../../api/admin';
import { newsApi } from '../../api/news';
import { useNotification } from '../../context/NotificationContext';
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
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    if (news && isOpen) {
      // сразу показываем то, что уже есть в списке...
      setFormData({
        title: news.title,
        content: '',
        excerpt: '',
        category: '',
      });
      setCurrentImageUrl(news.coverImageUrl || null);
      setImageChanged(false);
      setLoadingDetails(true);

      // ...и догружаем полную новость (текст, описание, категорию, обложку)
      newsApi.getById(news.id)
          .then((full) => {
            setFormData({
              title: full.title,
              content: full.content,
              excerpt: full.excerpt || '',
              category: full.category || '',
            });
            setCurrentImageUrl(full.imageUrl || null);
          })
          .catch((err) => {
            console.error('Error loading news details:', err);
            setError('Не удалось загрузить полные данные новости. Проверьте поля перед сохранением.');
          })
          .finally(() => setLoadingDetails(false));
    } else if (isOpen) {
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: '',
      });
      setCurrentImageUrl(null);
      setImageChanged(false);
    }
    setError(null);
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

  const handleClose = () => {
    // если обложку меняли, но "Сохранить" не нажимали — всё равно обновим список
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
        ...(formData.excerpt && { excerpt: formData.excerpt }),
        ...(formData.category && { category: formData.category }),
      };

      console.log('Sending payload:', JSON.stringify(payload));

      if (news) {
        await adminApi.updateNews(news.id, payload);
        notify('Новость обновлена');
      } else {
        await adminApi.createNews(payload);
        notify('Новость создана');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      setError(
          err.response?.data?.message ||
          err.response?.data?.title ||
          JSON.stringify(err.response?.data) ||
          'Ошибка при сохранении новости'
      );
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
              <div className="p-3 bg-red-900/40 text-red-400 border border-red-800 rounded-lg text-sm">
                {error}
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Заголовок <span className="text-red-400">*</span>
            </label>
            <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Заголовок новости"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                required
            />
          </div>

          <ImageUploadField
              label="Обложка новости"
              currentImageUrl={currentImageUrl}
              disabled={!news || loadingDetails}
              disabledHint="Сначала сохраните новость, затем откройте её снова, чтобы добавить обложку"
              onUpload={async (file) => {
                const updated = await adminApi.uploadNewsImage(news!.id, file);
                setCurrentImageUrl(updated.imageUrl || null);
                setImageChanged(true);
                notify('Обложка новости обновлена');
              }}
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Краткое описание
            </label>
            <input
                type="text"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Краткое резюме (для списков)"
                maxLength={160}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/160</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Содержание <span className="text-red-400">*</span>
            </label>
            <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Полное содержание новости"
                rows={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Категория
            </label>
            <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Например: Полезные советы, Обновления и т.д."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
                type="submit"
                disabled={loading || loadingDetails}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading && <Spinner />}
              {news ? 'Сохранить изменения' : 'Создать новость'}
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