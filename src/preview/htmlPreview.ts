import { MAX_RENDERED_LINES, MAX_RENDERED_TEXT_CHARS } from '@/preview/constants';
import { PreviewHtmlContent } from '@/types';

export interface HtmlPreviewResult {
  content: PreviewHtmlContent;
  isTruncated: boolean;
  message: string | null;
}

export interface BuildHtmlPreviewOptions {
  byteLimit: number;
  objectSize?: number;
}

export const buildHtmlPreview = (
  bytes: Uint8Array,
  { byteLimit, objectSize }: BuildHtmlPreviewOptions
): HtmlPreviewResult => {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let text = decoder.decode(bytes);
  let truncated = typeof objectSize === 'number'
    ? bytes.byteLength < objectSize
    : bytes.byteLength === byteLimit && bytes.byteLength > 0;

  if (text.length > MAX_RENDERED_TEXT_CHARS) {
    text = text.slice(0, MAX_RENDERED_TEXT_CHARS);
    truncated = true;
  }

  const lineCount = Math.min(
    (text.match(/\r\n|\r|\n/g)?.length ?? 0) + 1,
    MAX_RENDERED_LINES
  );

  return {
    content: {
      kind: 'html',
      html: text,
      text,
      lineCount,
      truncated,
    },
    isTruncated: truncated,
    message: truncated ? 'Preview truncated. The full file may contain additional content.' : null,
  };
};
