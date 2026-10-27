/**
 * Вложения публикации: .pdf, .txt, .docx и .mp4 (фотографии .png/.jpg добавляются отдельным блоком как фото).
 * Те же пределы, что на сервере: 10 МБ для документов, 50 МБ для видео, до 5 файлов в публикации.
 * Сервер всё равно проверяет содержимое файла: это быстрый отказ без лишней передачи.
 */
export const POST_FILE_ACCEPT = '.pdf,.txt,.docx,.mp4';
export const POST_FILE_EXTENSIONS = ['.pdf', '.txt', '.docx', '.mp4'] as const;
export const MAX_POST_FILES = 5;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const extensionOf = (name: string): string => {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
};

export const maxBytesFor = (name: string): number => (extensionOf(name) === '.mp4' ? MAX_VIDEO_BYTES : MAX_DOCUMENT_BYTES);

/** Текст ошибки для файла или пустая строка, если файл подходит. */
export function checkPostFile(file: { name: string; size: number }): string {
  const ext = extensionOf(file.name);
  if (!(POST_FILE_EXTENSIONS as readonly string[]).includes(ext)) {
    const photo = ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp';
    return photo
      ? `«${file.name}»: фотографии добавляются в блоке «Фотографии» выше.`
      : `«${file.name}»: допустимы только .pdf, .txt, .docx и .mp4.`;
  }
  if (file.size === 0) return `«${file.name}»: файл пустой.`;
  if (file.size > maxBytesFor(file.name)) {
    return `«${file.name}»: слишком большой, для ${ext} предел ${maxBytesFor(file.name) / (1024 * 1024)} МБ.`;
  }
  return '';
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} МБ`;
}

/** Значок Font Awesome по типу вложения. */
export function fileIcon(nameOrType: string): string {
  const s = nameOrType.toLowerCase();
  if (s.endsWith('.pdf') || s.includes('pdf')) return 'fa-file-pdf';
  if (s.endsWith('.docx') || s.includes('word')) return 'fa-file-word';
  if (s.endsWith('.mp4') || s.includes('video')) return 'fa-file-video';
  return 'fa-file-lines';
}
