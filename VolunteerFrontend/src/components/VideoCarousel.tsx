import { useState, useEffect, useRef } from 'react';
import { videoLinksApi } from '../api/VideoLink.ts';
import type { VideoLinkResponseDto } from '../types/VideoLink';

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spin() {
    return (
        <svg className="w-6 h-6 animate-spin text-white/30" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

// ── VideoCarousel ─────────────────────────────────────────────────────────────

export function VideoCarousel() {
    const [items, setItems] = useState<VideoLinkResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [current, setCurrent] = useState(0);
    const [playing, setPlaying] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        videoLinksApi
            .getAll(0, 50)
            .then(res => setItems(res.items))
            .catch(e => setError((e as Error).message))
            .finally(() => setLoading(false));
    }, []);

    // Reset current index when items change
    useEffect(() => {
        setCurrent(0);
        setPlaying(null);
    }, [items.length]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-white/30">
                <Spin />
                <span className="text-sm">Загрузка видео...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-16">
                <p className="text-gray-400 text-sm">{error}</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <p className="text-gray-400 text-sm">Видеоматериалы не добавлены</p>
            </div>
        );
    }

    const total = items.length;
    const prev = () => { setCurrent(p => (p - 1 + total) % total); setPlaying(null); };
    const next = () => { setCurrent(p => (p + 1) % total); setPlaying(null); };

    const item = items[current];

    // Determine if it's a YouTube embed URL
    const youtubeMatch = item.url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    );
    const youtubeId = youtubeMatch?.[1] ?? null;

    return (
        <div className="w-full flex flex-col items-center">
            {/* Main player */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl mb-8 bg-gray-900 aspect-video max-h-[480px] w-full max-w-4xl">
                {playing === item.id && youtubeId ? (
                    <iframe
                        key={youtubeId}
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title={item.title}
                    />
                ) : playing === item.id && !youtubeId ? (
                    /* Fallback for non-YouTube direct video URLs */
                    <video
                        ref={videoRef}
                        src={item.url}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        onEnded={() => setPlaying(null)}
                    />
                ) : (
                    <>
                        {item.thumbnailUrl ? (
                            <img
                                src={item.thumbnailUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <i className="fas fa-film text-white/10 text-6xl" />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                        {/* Play button */}
                        <button
                            onClick={() => setPlaying(item.id)}
                            className="absolute inset-0 flex items-center justify-center group"
                            aria-label="Воспроизвести"
                        >
                            <div className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
                                <i className="fas fa-play text-blue-600 text-2xl ml-1" />
                            </div>
                        </button>

                        {/* Caption */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
                            <h3 className="text-white font-bold text-xl sm:text-2xl leading-tight mb-1">
                                {item.title}
                            </h3>
                            {item.description && (
                                <p className="text-white/70 text-sm hidden sm:block line-clamp-2">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </>
                )}

                {/* Nav arrows */}
                {total > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition z-10"
                        >
                            <i className="fas fa-chevron-left text-sm" />
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition z-10"
                        >
                            <i className="fas fa-chevron-right text-sm" />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnail strip */}
            {total > 1 && (
                <div className="flex justify-center gap-3 mb-6 flex-wrap max-w-4xl px-4">
                    {items.map((v, i) => (
                        <button
                            key={v.id}
                            onClick={() => { setCurrent(i); setPlaying(null); }}
                            className={`relative rounded-xl overflow-hidden aspect-video transition-all duration-200 w-20 h-12 ${
                                i === current
                                    ? 'ring-2 ring-blue-600 ring-offset-2 shadow-md scale-110'
                                    : 'opacity-50 hover:opacity-75'
                            }`}
                        >
                            {v.thumbnailUrl ? (
                                <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                    <i className="fas fa-play text-white/30 text-xs" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Dots */}
            {total > 1 && (
                <div className="flex justify-center gap-2">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setCurrent(i); setPlaying(null); }}
                            className={`rounded-full transition-all duration-300 ${
                                i === current
                                    ? 'w-6 h-2.5 bg-blue-600'
                                    : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}