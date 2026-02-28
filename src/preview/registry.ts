import { PreviewHandlerId } from '@/types';

const HANDLER_EXTENSION_ORDER: Array<[PreviewHandlerId, string[]]> = [
  ['image', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif']],
  ['video', ['mp4', 'mov', 'webm', 'm4v', 'ogv', 'avi', 'mkv']],
  ['csv', ['csv', 'tsv']],
  ['text', ['txt', 'log', 'md', 'json', 'yaml', 'yml', 'xml', 'ini', 'conf', 'toml', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'sh']],
];

const TEXT_LANGUAGE_BY_EXTENSION = new Map<string, string>([
  ['txt', 'plaintext'],
  ['log', 'log'],
  ['md', 'markdown'],
  ['json', 'json'],
  ['yaml', 'yaml'],
  ['yml', 'yaml'],
  ['xml', 'xml'],
  ['ini', 'ini'],
  ['conf', 'ini'],
  ['toml', 'toml'],
  ['js', 'javascript'],
  ['jsx', 'javascript'],
  ['ts', 'typescript'],
  ['tsx', 'typescript'],
  ['css', 'css'],
  ['html', 'html'],
  ['py', 'python'],
  ['sh', 'shell'],
]);

const HANDLER_BY_EXTENSION = HANDLER_EXTENSION_ORDER.reduce<Map<string, PreviewHandlerId>>((map, [handlerId, extensions]) => {
  extensions.forEach((extension) => {
    map.set(extension, handlerId);
  });
  return map;
}, new Map());

export const getObjectExtension = (key: string): string => {
  const cleanedKey = key.split('?')[0];
  const extension = cleanedKey.split('.').pop()?.toLowerCase();
  return extension || '';
};

export const resolvePreviewHandler = (key: string): PreviewHandlerId => {
  const extension = getObjectExtension(key);
  return HANDLER_BY_EXTENSION.get(extension) || 'unsupported';
};

export const getPreviewLanguage = (key: string): string | null => {
  const extension = getObjectExtension(key);
  return TEXT_LANGUAGE_BY_EXTENSION.get(extension) || null;
};

export const isMediaHandler = (handlerId: PreviewHandlerId): handlerId is 'image' | 'video' => {
  return handlerId === 'image' || handlerId === 'video';
};

export const isStructuredTextHandler = (handlerId: PreviewHandlerId): handlerId is 'csv' | 'text' => {
  return handlerId === 'csv' || handlerId === 'text';
};
