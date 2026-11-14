import { describe, expect, it } from 'vitest';
import { chunkCsv, readUtf8, splitCsvRecords } from './csvChunks';

describe('splitCsvRecords', () => {
  it('splits records and strips CRLF', () => {
    expect(splitCsvRecords('ID,login\r\n1,a\r\n2,b\r\n')).toEqual({ header: 'ID,login', records: ['1,a', '2,b'] });
  });

  it('keeps line breaks inside quoted fields', () => {
    const text = 'ID,description\n1,"first line\nsecond line"\n2,"he said ""hi"""';
    expect(splitCsvRecords(text).records).toEqual(['1,"first line\nsecond line"', '2,"he said ""hi"""']);
  });

  it('ignores empty lines', () => {
    expect(splitCsvRecords('ID\n\n1\n\n').records).toEqual(['1']);
  });

  it('handles a file with only a header', () => {
    expect(splitCsvRecords('ID,login')).toEqual({ header: 'ID,login', records: [] });
  });
});

describe('chunkCsv', () => {
  it('repeats the header and numbers chunks by original record', () => {
    const chunks = chunkCsv('ID\n1\n2\n3\n4\n5', 2);
    expect(chunks.map(c => [c.csv, c.firstLine, c.rows])).toEqual([
      ['ID\n1\n2', 2, 2],
      ['ID\n3\n4', 4, 2],
      ['ID\n5', 6, 1],
    ]);
  });

  it('returns no chunks for a header-only file', () => {
    expect(chunkCsv('ID', 10)).toEqual([]);
  });
});

describe('readUtf8', () => {
  it('reads UTF-8 and drops the byte order mark', async () => {
    const file = new File([new Uint8Array([0xef, 0xbb, 0xbf]), 'ID,имя'], 'a.csv');
    expect(await readUtf8(file)).toBe('ID,имя');
  });

  it('rejects text in another encoding', async () => {
    const file = new File([new Uint8Array([0xc8, 0xe2, 0xe0, 0xed])], 'cp1251.csv');
    await expect(readUtf8(file)).rejects.toThrow();
  });
});
