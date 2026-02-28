import { PreviewKind } from '@/types';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'm4v', 'ogv', 'avi', 'mkv']);

const getExtension = (key: string): string => {
  const cleanedKey = key.split('?')[0];
  const extension = cleanedKey.split('.').pop()?.toLowerCase();
  return extension || '';
};

export const getPreviewKind = (key: string): PreviewKind => {
  const extension = getExtension(key);

  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  return 'unsupported';
};

export const isPreviewableObjectKey = (key: string): boolean => getPreviewKind(key) !== 'unsupported';
