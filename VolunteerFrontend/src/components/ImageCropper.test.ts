// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cropFocus, defaultRect, fitCropToFrame, fromApiCrop, MIN_FRAME, scaleRect, toApiCrop } from './ImageCropper';

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

describe('вписывание кадра в рамку другой формы', () => {
  const inside = (c: { x: number; y: number; width: number; height: number }) => {
    expect(c.x).toBeGreaterThanOrEqual(-1e-9);
    expect(c.y).toBeGreaterThanOrEqual(-1e-9);
    expect(c.x + c.width).toBeLessThanOrEqual(1 + 1e-9);
    expect(c.y + c.height).toBeLessThanOrEqual(1 + 1e-9);
  };

  it('та же форма — окно совпадает с кадром', () => {
    const crop = { x: 0.1, y: 0.2, width: 0.5, height: 0.5 };   // 16:10 на фото 16:10
    const win = fitCropToFrame(crop, 16 / 10, 16 / 10);
    expect(win.x).toBeCloseTo(0.1, 9);
    expect(win.y).toBeCloseTo(0.2, 9);
    expect(win.width).toBeCloseTo(0.5, 9);
    expect(win.height).toBeCloseTo(0.5, 9);
  });

  it('вертикальный билет из альбомного кадра: полная высота кадра, центр и масштаб сохранены', () => {
    for (const imageAspect of [16 / 9, 4 / 3, 1, 3 / 4]) {
      const r = defaultRect(imageAspect * 1000, 1000, 16 / 10);
      const crop = toApiCrop(scaleRect(r, -0.2, (imageAspect * 1000) / ((16 / 10) * 1000), 1));
      const win = fitCropToFrame(crop, imageAspect, 2 / 3);
      inside(win);
      expect((win.width * imageAspect) / win.height).toBeCloseTo(2 / 3, 6);
      expect(win.height).toBeCloseTo(crop.height, 9);              // крупный план остаётся крупным
      expect(win.x + win.width / 2).toBeCloseTo(crop.x + crop.width / 2, 9);
    }
  });

  it('у края фото окно сдвигается внутрь, а не выходит за границу', () => {
    const crop = { x: 0, y: 0, width: 0.3, height: 0.3 * (16 / 9) / (16 / 10) };
    const win = fitCropToFrame(crop, 16 / 9, 3);                   // очень широкая рамка
    inside(win);
    expect((win.width * 16 / 9) / win.height).toBeCloseTo(3, 6);
  });
});
