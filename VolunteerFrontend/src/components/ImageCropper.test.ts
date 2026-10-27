// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cropFocus, defaultRect, fromApiCrop, MIN_FRAME, scaleRect, toApiCrop } from './ImageCropper';

describe('рамка кадрирования', () => {
  it('область по умолчанию имеет нужные пропорции в пикселях и целиком внутри фото', () => {
    for (const [w, h, aspect] of [[2000, 1000, 1], [1000, 2000, 1], [1600, 1200, 16 / 10], [3000, 900, 4 / 3]] as const) {
      const r = defaultRect(w, h, aspect);
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(1 + 1e-9);
      expect(r.y + r.h).toBeLessThanOrEqual(1 + 1e-9);
      expect((r.w * w) / (r.h * h)).toBeCloseTo(aspect, 6);
    }
  });

  it('аватар из широкого фото — квадрат по центру, из высокого — сдвигается по вертикали', () => {
    const wide = defaultRect(2000, 1000, 1);
    expect(wide.x).toBeCloseTo(0.25, 6);
    const tall = defaultRect(1000, 2000, 1, 0);
    expect(tall.y).toBe(0);
  });

  it('масштабирование сохраняет пропорции, не выходит за границы и не меньше минимума', () => {
    const hr = 1000 / (1 * 2000);
    const r = defaultRect(2000, 1000, 1);
    const bigger = scaleRect(r, 0.5, hr, Math.min(1, 1 / hr));
    expect(bigger.x + bigger.w).toBeLessThanOrEqual(1 + 1e-9);
    expect(bigger.h).toBeCloseTo(bigger.w * hr, 9);
    expect(scaleRect(r, -5, hr, 1).w).toBe(MIN_FRAME);
  });

  it('переводит рамку в формат сервера и обратно', () => {
    const rect = { x: 0.1, y: 0.2, w: 0.5, h: 0.4 };
    expect(toApiCrop(rect)).toEqual({ x: 0.1, y: 0.2, width: 0.5, height: 0.4 });
    expect(fromApiCrop(toApiCrop(rect))).toEqual(rect);
  });

  it('точка фокуса для плиток — центр выбранной области', () => {
    expect(cropFocus(null)).toBe('50% 50%');
    expect(cropFocus({ x: 0, y: 0, width: 0.5, height: 0.5 })).toBe('25% 25%');
    expect(cropFocus({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 })).toBe('75% 75%');
  });
});
