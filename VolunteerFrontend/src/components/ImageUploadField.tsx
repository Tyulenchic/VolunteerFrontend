import { useRef, useState } from 'react';

interface ImageUploadFieldProps {
    label?: string;
    currentImageUrl?: string | null;
    onUpload: (file: File) => Promise<void>;
    onDelete?: () => Promise<void>;
    disabled?: boolean;
    disabledHint?: string;
    accept?: string;
    maxSizeMB?: number;
}

export function ImageUploadField({
                                     label = 'Изображение',
                                     currentImageUrl,
                                     onUpload,
                                     onDelete,
                                     disabled = false,
                                     disabledHint,
                                     accept = 'image/jpeg,image/png,image/webp',
                                     maxSizeMB = 10,
                                 }: ImageUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const displayUrl = preview ?? currentImageUrl ?? null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`Файл слишком большой. Максимум ${maxSizeMB} МБ.`);
            return;
        }

        setError(null);
        setPreview(URL.createObjectURL(file));
        setBusy(true);
        try {
            await onUpload(file);
        } catch (err) {
            console.error(err);
            setError('Ошибка загрузки изображения');
            setPreview(null);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        setBusy(true);
        setError(null);
        try {
            await onDelete();
            setPreview(null);
        } catch (err) {
            console.error(err);
            setError('Ошибка удаления изображения');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <label className="text-gray-400 text-sm mb-2 block">{label}</label>

            <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                    {displayUrl ? (
                        <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <i className="fas fa-image text-gray-600 text-2xl" />
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled || busy}
                        className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
                    >
                        {busy ? 'Загрузка...' : displayUrl ? 'Заменить фото' : 'Загрузить фото'}
                    </button>

                    {displayUrl && onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={disabled || busy}
                            className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 rounded-lg transition"
                        >
                            Удалить фото
                        </button>
                    )}

                    {disabled && disabledHint && (
                        <p className="text-gray-500 text-xs">{disabledHint}</p>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
    );
}