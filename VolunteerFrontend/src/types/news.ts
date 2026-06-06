export type NewsCategory = 'events' | 'social' | 'eco' | 'education';
export interface NewsComment { id: number; author: string; text: string; date: string; }
export interface NewsItem { id: number; title: string; excerpt: string; category: NewsCategory; author: string; date: string; image: string; comments: NewsComment[]; }
export const CAT_LABELS: Record<NewsCategory, string> = { events: 'Мероприятия', social: 'Соц. помощь', eco: 'Экология', education: 'Обучение' };
export const CAT_COLORS: Record<NewsCategory, string> = { events: 'bg-blue-100 text-blue-700', social: 'bg-purple-100 text-purple-700', eco: 'bg-teal-100 text-teal-700', education: 'bg-amber-100 text-amber-700' };
export const PER_PAGE = 6;
