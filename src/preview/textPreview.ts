import { MAX_RENDERED_LINES, MAX_RENDERED_TEXT_CHARS } from '@/preview/constants';
import { getPreviewLanguage } from '@/preview/registry';
import { PreviewTextContent } from '@/types';

export interface BuildTextPreviewOptions {
  key: string;
  byteLimit: number;
  objectSize?: number;
}

export interface TextPreviewResult {
  content: PreviewTextContent;
  isTruncated: boolean;
  message: string | null;
}

const truncateByLines = (text: string, maxLines: number): { text: string; truncated: boolean; lineCount: number } => {
  if (!text) {
    return { text: '', truncated: false, lineCount: 0 };
  }

  const newlinePattern = /\r\n|\r|\n/g;
  let lineCount = 1;
  let match: RegExpExecArray | null = null;

  while ((match = newlinePattern.exec(text)) !== null) {
    lineCount += 1;
    if (lineCount > maxLines) {
      return {
        text: text.slice(0, match.index),
        truncated: true,
        lineCount: maxLines,
      };
    }
  }

  return {
    text,
    truncated: false,
    lineCount,
  };
};

export const buildTextPreview = (
  bytes: Uint8Array,
  { key, byteLimit, objectSize }: BuildTextPreviewOptions
): TextPreviewResult => {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let text = decoder.decode(bytes);
  let truncated = typeof objectSize === 'number'
    ? bytes.byteLength < objectSize
    : bytes.byteLength === byteLimit && bytes.byteLength > 0;

  if (text.length > MAX_RENDERED_TEXT_CHARS) {
    text = text.slice(0, MAX_RENDERED_TEXT_CHARS);
    truncated = true;
  }

  const lineResult = truncateByLines(text, MAX_RENDERED_LINES);
  text = lineResult.text;
  truncated = truncated || lineResult.truncated;

  return {
    content: {
      kind: 'text',
      text,
      lineCount: lineResult.lineCount,
      truncated,
      language: getPreviewLanguage(key),
    },
    isTruncated: truncated,
    message: truncated ? 'Preview truncated to keep rendering responsive.' : null,
  };
};
