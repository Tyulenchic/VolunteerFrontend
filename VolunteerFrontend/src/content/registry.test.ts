// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CONTENT_GROUPS, emptyItem, parseStored, serialize } from './registry';

const entries = CONTENT_GROUPS.flatMap(g => g.entries);

describe('реестр редактируемых текстов', () => {
  it('ключи уникальны и допустимы для сервера', () => {
    const keys = entries.map(e => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^[a-z0-9][a-z0-9._-]{0,99}$/);
  });

  it('исходное значение каждого блока переживает сохранение и чтение без потерь', () => {
    for (const entry of entries) {
      const stored = serialize(entry, entry.default);
      expect(parseStored(entry, stored)).toEqual(entry.default);
      expect(stored.length).toBeLessThan(60_000);
    }
  });

  it('без изменения возвращается копия исходного значения, а не сам объект', () => {
    const faq = entries.find(e => e.key === 'faq.categories')!;
    const copy = parseStored(faq, undefined) as unknown[];
    expect(copy).toEqual(faq.default);
    expect(copy).not.toBe(faq.default);
  });

  it('повреждённый JSON заменяется исходным значением', () => {
    const faq = entries.find(e => e.key === 'faq.categories')!;
    expect(parseStored(faq, '{не json')).toEqual(faq.default);
  });

  it('пустые строки в списках не сохраняются, в том числе во вложенных', () => {
    const rules = entries.find(e => e.key === 'rules.sections')!;
    const value = [{ id: 'a', title: 'T', icon: 'fa-x', items: ['один', '', '  ', 'два'] }];
    expect(JSON.parse(serialize(rules, value))[0].items).toEqual(['один', 'два']);
  });

  it('новый элемент списка создаётся пустым по схеме', () => {
    const faq = entries.find(e => e.key === 'faq.categories')!;
    expect(emptyItem(faq.fields!)).toEqual({ cat: '', icon: '', color: '', items: [] });
  });

  it('у каждой группы есть адрес страницы на сайте', () => {
    for (const g of CONTENT_GROUPS) expect(g.path.startsWith('/')).toBe(true);
  });
});
