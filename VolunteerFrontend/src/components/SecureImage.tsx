import { useCallback, useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { imagesApi } from '../api/images';
import { apiClient } from '../api/client';
import { imageIdFromUrl } from '../utils/imageUrl';

/** Blob-адрес изображения, которое отдаётся только с токеном (например, свой аватар на проверке). Освобождается при смене/размонтировании. */
export function useAuthBlobUrl(url: string | null | undefined, version?: unknown): string | null {
  const [blob, setBlob] = useState<string | null>(null);
  useEffect(() => {
    if (!url) { setBlob(null); return; }
    let alive = true;
    let created: string | null = null;
    apiClient.get<Blob>(url, { responseType: 'blob' })
      .then(r => { if (!alive) return; created = URL.createObjectURL(r.data); setBlob(created); })
      .catch((err: unknown) => {
        if (!alive) return;
        console.error('[images] Не удалось загрузить изображение с токеном', { url, status: (err as { response?: { status?: number } })?.response?.status });
        setBlob(null);
      });
    return () => { alive = false; if (created) URL.revokeObjectURL(created); };
  }, [url, version]);
  return blob;
}

/**
 * Адрес изображения с запасным путём. Публичные изображения открываются обычной ссылкой. Изображения черновиков
 * мероприятий/новостей публично недоступны (сервер отвечает 404), а <img> не умеет отправлять токен, поэтому при
 * ошибке автор и администратор получают картинку запросом с токеном (/preview) и показывают её как blob-адрес.
 */
export function useSecureSrc(src: string | null | undefined): { src: string | null; onError: () => void; failed: boolean } {
  const [override, setOverride] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const tried = useRef<string | null>(null);

  useEffect(() => {
    // новый адрес — начинаем заново
    setOverride(null);
    setFailed(false);
    tried.current = null;
  }, [src]);

  useEffect(() => () => { if (override) URL.revokeObjectURL(override); }, [override]);

  const onError = useCallback(() => {
    const id = imageIdFromUrl(src);
    if (!src || !id || tried.current === src) {
      // Второй сбой подряд (или адрес не похож на изображение API): показываем заглушку и оставляем след в консоли.
      console.error('[images] Изображение не загрузилось, показана заглушка:', src,
        '— откройте адрес в новой вкладке и проверьте вкладку Network (статус, заголовок Cross-Origin-Resource-Policy, CORS).');
      setFailed(true);
      return;
    }
    tried.current = src;
    // <img> не показал картинку: либо она непубличная (нужен токен), либо запрос блокирует браузер/сервер.
    console.warn('[images] <img> не смог загрузить', src, '— пробую запрос с токеном (/preview).');
    imagesApi.preview(id, /\/thumbnail(\?|$)/.test(src))
      .then(blob => setOverride(URL.createObjectURL(blob)))
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        console.error('[images] Запрос с токеном тоже не удался', { src, status: status ?? 'нет ответа (сеть/CORS)' });
        setFailed(true);
      });
  }, [src]);

  return { src: override ?? src ?? null, onError, failed };
}

/** <img>, который сам находит способ показать непубличное изображение своего автора. */
export function SecureImage({ src, alt, fallback, ...rest }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string | null; fallback?: React.ReactNode }) {
  const resolved = useSecureSrc(src);
  if (!resolved.src || resolved.failed) return <>{fallback ?? null}</>;
  // data-fade/data-loaded: фото проявляется по загрузке (index.css). Атрибут ставится напрямую в DOM — без перерисовки;
  // уже загруженное из кэша фото (complete) отмечается сразу, чтобы не мигало.
  const mark = (img: HTMLImageElement) => { img.dataset.loaded = ''; };
  return (
    <img {...rest} src={resolved.src} alt={alt ?? ''} data-fade=""
      ref={img => { if (img?.complete && img.naturalWidth) mark(img); }}
      onLoad={e => { mark(e.currentTarget); rest.onLoad?.(e); }}
      onError={resolved.onError} />
  );
}
