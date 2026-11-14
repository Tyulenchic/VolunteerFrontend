export interface CsvChunk {
  /** Заголовок и записи порции — готовый CSV для отправки на сервер. */
  csv: string;
  /** Номер первой записи порции в исходном файле (заголовок — запись 1). */
  firstLine: number;
  rows: number;
}

export interface SplitCsv {
  header: string;
  records: string[];
}

/** Делит текст CSV на записи с учётом кавычек: перенос строки внутри "…" не завершает запись. */
export function splitCsvRecords(text: string): SplitCsv {
  const records: string[] = [];
  let start = 0;
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') quoted = !quoted;
    else if (ch === '\n' && !quoted) {
      records.push(text.slice(start, i).replace(/\r$/, ''));
      start = i + 1;
    }
  }
  if (start < text.length) records.push(text.slice(start).replace(/\r$/, ''));
  const nonEmpty = records.filter(r => r.trim() !== '');
  const [header = '', ...rest] = nonEmpty;
  return { header, records: rest };
}

export function chunkCsv(text: string, size: number): CsvChunk[] {
  const { header, records } = splitCsvRecords(text);
  const chunks: CsvChunk[] = [];
  for (let i = 0; i < records.length; i += size) {
    const part = records.slice(i, i + size);
    chunks.push({ csv: `${header}\n${part.join('\n')}`, firstLine: i + 2, rows: part.length });
  }
  return chunks;
}

/** Читает файл строго как UTF-8: файл в другой кодировке (например, сохранённый Excel в Windows-1251) отклоняется, а не искажается. */
export async function readUtf8(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
