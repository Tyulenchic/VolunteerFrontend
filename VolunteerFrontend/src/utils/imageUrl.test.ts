// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { absoluteImageUrl, absolutizeImageUrls, imageIdFromUrl } from './imageUrl';

const ID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';

describe('адреса изображений', () => {
  it('дополняет только адреса изображений и не трогает прочие строки', () => {
    expect(absoluteImageUrl(`/api/images/${ID}`)).toMatch(new RegExp(`/api/images/${ID}$`));
    expect(absoluteImageUrl('/api/users/me/avatar/image')).toContain('/api/users/me/avatar/image');
    expect(absoluteImageUrl('/api/events')).toBe('/api/events');
    expect(absoluteImageUrl('https://cdn.example/x.png')).toBe('https://cdn.example/x.png');
    expect(absoluteImageUrl(null)).toBeNull();
  });

  it('обходит вложенные объекты и массивы, не ломая остальные данные', () => {
    const data = {
      title: 'Мероприятие',
      imageUrl: `/api/images/${ID}`,
      organization: { logoUrl: `/api/images/${ID}/thumbnail`, name: '/api/images/не-картинка?' },
      posts: [{ images: [{ url: `/api/images/${ID}` }] }],
      count: 3,
      none: null,
    };
    const result = absolutizeImageUrls(structuredClone(data));
    expect(result.title).toBe(data.title);
    expect(result.count).toBe(3);
    expect(result.none).toBeNull();
    expect(result.organization.logoUrl.endsWith(`/api/images/${ID}/thumbnail`)).toBe(true);
    expect(result.posts[0].images[0].url.endsWith(`/api/images/${ID}`)).toBe(true);
  });

  it('достаёт идентификатор изображения из адреса', () => {
    expect(imageIdFromUrl(`https://api.example.org/api/images/${ID}/thumbnail`)).toBe(ID);
    expect(imageIdFromUrl('/api/events/1')).toBeNull();
    expect(imageIdFromUrl(null)).toBeNull();
  });
});
