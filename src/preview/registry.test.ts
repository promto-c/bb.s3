import { describe, expect, it } from 'vitest';
import { getPreviewLanguage, resolvePreviewHandler } from '@/preview/registry';

describe('resolvePreviewHandler', () => {
  it('maps known extensions to their handlers', () => {
    expect(resolvePreviewHandler('folder/photo.svg')).toBe('image');
    expect(resolvePreviewHandler('folder/movie.mkv')).toBe('video');
    expect(resolvePreviewHandler('scenes/garden.ply')).toBe('splat');
    expect(resolvePreviewHandler('scenes/garden.splat')).toBe('splat');
    expect(resolvePreviewHandler('folder/data.csv')).toBe('csv');
    expect(resolvePreviewHandler('folder/page.html')).toBe('html');
    expect(resolvePreviewHandler('folder/page.htm')).toBe('html');
    expect(resolvePreviewHandler('folder/app.tsx')).toBe('text');
  });

  it('falls back to unsupported for unknown extensions', () => {
    expect(resolvePreviewHandler('folder/archive.bin')).toBe('unsupported');
  });
});

describe('getPreviewLanguage', () => {
  it('returns text language hints for code files', () => {
    expect(getPreviewLanguage('src/main.tsx')).toBe('typescript');
    expect(getPreviewLanguage('docs/readme.md')).toBe('markdown');
  });
});
