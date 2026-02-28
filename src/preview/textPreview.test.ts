import { describe, expect, it } from 'vitest';
import { MAX_RENDERED_LINES } from '@/preview/constants';
import { buildTextPreview } from '@/preview/textPreview';

describe('buildTextPreview', () => {
  it('decodes text previews and attaches a language hint', () => {
    const bytes = new TextEncoder().encode('const value = 1;\nconsole.log(value);\n');
    const result = buildTextPreview(bytes, {
      key: 'src/app.ts',
      byteLimit: bytes.byteLength,
      objectSize: bytes.byteLength,
    });

    expect(result.content.language).toBe('typescript');
    expect(result.content.text).toContain('console.log');
    expect(result.isTruncated).toBe(false);
  });

  it('truncates very large previews by line count', () => {
    const hugeText = Array.from({ length: MAX_RENDERED_LINES + 50 }, (_, index) => `line ${index + 1}`).join('\n');
    const bytes = new TextEncoder().encode(hugeText);
    const result = buildTextPreview(bytes, {
      key: 'logs/server.log',
      byteLimit: bytes.byteLength,
      objectSize: bytes.byteLength,
    });

    expect(result.content.lineCount).toBe(MAX_RENDERED_LINES);
    expect(result.content.truncated).toBe(true);
    expect(result.message).toContain('truncated');
  });
});
