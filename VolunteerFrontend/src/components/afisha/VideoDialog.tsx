import type { VideoLinkResponseDto } from '../../types/VideoLink';
import { Modal } from '../Modal';
import { VolButton } from './VolButton';

/** Player window for one video link: the shared Modal, so it looks and behaves like every other window of the site. */
export function VideoDialog({ item, onClose }: { item: VideoLinkResponseDto; onClose: () => void }) {
  const youtubeId = item.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null;
  // Instagram posts/reels cannot be played as a file, but have an embeddable /embed/ version.
  const instagramCode = item.url.match(/instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/i)?.[1] ?? null;
  const isDirectFile = /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(item.url);

  return (
    <Modal isOpen onClose={onClose} title={item.title} maxWidth="max-w-4xl">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        {youtubeId ? (
          <iframe src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen title={item.title} />
        ) : instagramCode ? (
          <div className="flex h-full w-full justify-center">
            <iframe src={`https://www.instagram.com/reel/${instagramCode}/embed/`} className="h-full w-full max-w-[420px] border-0" allow="autoplay; encrypted-media; fullscreen" allowFullScreen title={item.title} />
          </div>
        ) : isDirectFile ? (
          <video src={item.url} className="h-full w-full object-contain" controls autoPlay />
        ) : (
          // A service that cannot be embedded (VK, TikTok, Telegram…): open the link instead of a black screen.
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center text-white">
            <p className="text-[14px]">Это видео нельзя воспроизвести прямо на сайте.</p>
            <VolButton kind="light" icon="arrow" href={item.url}>Открыть видео</VolButton>
          </div>
        )}
      </div>
      {item.description && <p className="mt-4 text-[14px] leading-relaxed text-gray-700 break-words">{item.description}</p>}
    </Modal>
  );
}
