import { describe, expect, it } from 'vitest';
import { MAX_RENDERED_TEXT_CHARS } from '@/preview/constants';
import { buildHtmlPreview } from '@/preview/htmlPreview';

describe('buildHtmlPreview', () => {
  it('decodes HTML into an html content object', () => {
    const html = '<html><body><h1>Hello</h1></body></html>';
    const bytes = new TextEncoder().encode(html);
    const result = buildHtmlPreview(bytes, {
      byteLimit: bytes.byteLength,
      objectSize: bytes.byteLength,
    });

    expect(result.content.kind).toBe('html');
    expect(result.content.html).toContain('<h1>Hello</h1>');
    expect(result.content.text).toBe(result.content.html);
    expect(result.isTruncated).toBe(false);
    expect(result.message).toBeNull();
  });

  it('sets truncated when bytes are smaller than object size', () => {
    const html = '<p>partial</p>';
    const bytes = new TextEncoder().encode(html);
    const result = buildHtmlPreview(bytes, {
      byteLimit: 1024,
      objectSize: bytes.byteLength + 500,
    });

    expect(result.content.truncated).toBe(true);
    expect(result.message).toContain('truncated');
  });

  it('truncates content exceeding max rendered characters', () => {
    const hugeHtml = '<p>' + 'x'.repeat(MAX_RENDERED_TEXT_CHARS + 100) + '</p>';
    const bytes = new TextEncoder().encode(hugeHtml);
    const result = buildHtmlPreview(bytes, {
      byteLimit: bytes.byteLength,
      objectSize: bytes.byteLength,
    });

    expect(result.content.truncated).toBe(true);
    expect(result.content.html.length).toBeLessThanOrEqual(MAX_RENDERED_TEXT_CHARS);
    expect(result.message).toContain('truncated');
  });

  it('counts lines correctly', () => {
    const html = '<html>\n<head>\n</head>\n<body>\n<p>Hi</p>\n</body>\n</html>';
    const bytes = new TextEncoder().encode(html);
    const result = buildHtmlPreview(bytes, {
      byteLimit: bytes.byteLength,
      objectSize: bytes.byteLength,
    });

    expect(result.content.lineCount).toBe(7);
  });
});
