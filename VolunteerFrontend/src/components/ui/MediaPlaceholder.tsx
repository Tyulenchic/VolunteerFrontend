import { VolIcon, type IconName } from '../afisha/VolIcon';

/**
 * Оформление вместо отсутствующего фото у новостей, мероприятий и публикаций. Не «сломанная картинка», а спокойный
 * тематический фон палитры (#BCD5FB → #F1F6FD) с мягкими формами и иконкой рубрики. Занимает родителя целиком
 * (absolute inset-0), поэтому рамка карточки и её пропорции не меняются — меняется только содержимое.
 */
const DEFAULT_ICON: Record<'news' | 'event' | 'post', IconName> = { news: 'news', event: 'cal', post: 'chat' };

export function MediaPlaceholder({ kind, icon, label }: { kind: 'news' | 'event' | 'post'; icon?: IconName; label?: string }) {
  return (
    <div className="vol-media-empty absolute inset-0 grid place-items-center overflow-hidden" role={label ? 'img' : undefined}
      aria-label={label} aria-hidden={label ? undefined : true}>
      <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white/80 text-vol-accent shadow-[0_6px_18px_rgba(11,32,56,.08)]">
        <VolIcon n={icon ?? DEFAULT_ICON[kind]} size={26} />
      </span>
    </div>
  );
}
