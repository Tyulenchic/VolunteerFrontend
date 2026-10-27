import { describe, expect, it } from 'vitest';
import { checkPostFile, extensionOf, fileIcon, formatSize, MAX_DOCUMENT_BYTES, MAX_VIDEO_BYTES } from './postFiles';

describe('checkPostFile', () => {
  it.each(['план.pdf', 'отчёт.docx', 'заметки.txt', 'ролик.mp4', 'ПЛАН.PDF'])('accepts %s', name => {
    expect(checkPostFile({ name, size: 1000 })).toBe('');
  });

  it('rejects other types and points photos to the photo block', () => {
    expect(checkPostFile({ name: 'a.exe', size: 10 })).toContain('допустимы только');
    expect(checkPostFile({ name: 'a.png', size: 10 })).toContain('Фотографии');
    expect(checkPostFile({ name: 'a.jpg', size: 10 })).toContain('Фотографии');
    expect(checkPostFile({ name: 'noext', size: 10 })).toContain('допустимы только');
  });

  it('applies 10 MB for documents and 50 MB for video', () => {
    expect(checkPostFile({ name: 'a.pdf', size: MAX_DOCUMENT_BYTES })).toBe('');
    expect(checkPostFile({ name: 'a.pdf', size: MAX_DOCUMENT_BYTES + 1 })).toContain('10 МБ');
    expect(checkPostFile({ name: 'a.mp4', size: MAX_VIDEO_BYTES })).toBe('');
    expect(checkPostFile({ name: 'a.mp4', size: MAX_VIDEO_BYTES + 1 })).toContain('50 МБ');
  });

  it('rejects an empty file', () => {
    expect(checkPostFile({ name: 'a.txt', size: 0 })).toContain('пустой');
  });
});

describe('helpers', () => {
  it('formats sizes', () => {
    expect(formatSize(500)).toBe('500 Б');
    expect(formatSize(2048)).toBe('2 КБ');
    expect(formatSize(5 * 1024 * 1024)).toBe('5,0 МБ');
  });
  it('finds the extension and the icon', () => {
    expect(extensionOf('a.b.PDF')).toBe('.pdf');
    expect(extensionOf('x')).toBe('');
    expect(fileIcon('doc.docx')).toBe('fa-file-word');
    expect(fileIcon('application/pdf')).toBe('fa-file-pdf');
    expect(fileIcon('video/mp4')).toBe('fa-file-video');
    expect(fileIcon('notes.txt')).toBe('fa-file-lines');
  });
});
