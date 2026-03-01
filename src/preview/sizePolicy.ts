import { AUTO_PREVIEW_BYTES, MANUAL_PREVIEW_BYTES } from '@/preview/constants';
import { PreviewBlockedReason, PreviewHandlerId, PreviewLoadMode } from '@/types';

export interface PreviewLoadPolicy {
  blockedReason: PreviewBlockedReason;
  canManualLoad: boolean;
  loadMode: PreviewLoadMode | null;
}

export const getPreviewLoadPolicy = (
  handlerId: PreviewHandlerId,
  size: number | undefined,
  manualRequested: boolean
): PreviewLoadPolicy => {
  if (handlerId === 'unsupported') {
    return {
      blockedReason: 'unsupported',
      canManualLoad: false,
      loadMode: null,
    };
  }

  if (handlerId === 'image' || handlerId === 'video' || handlerId === 'splat') {
    return {
      blockedReason: null,
      canManualLoad: false,
      loadMode: 'auto',
    };
  }

  if (typeof size === 'number') {
    if (size > MANUAL_PREVIEW_BYTES) {
      return {
        blockedReason: 'too-large',
        canManualLoad: false,
        loadMode: null,
      };
    }

    if (size > AUTO_PREVIEW_BYTES && !manualRequested) {
      return {
        blockedReason: 'manual',
        canManualLoad: true,
        loadMode: null,
      };
    }
  }

  return {
    blockedReason: null,
    canManualLoad: false,
    loadMode: manualRequested ? 'manual' : 'auto',
  };
};

export const getPreviewFetchBytes = (size: number | undefined, loadMode: PreviewLoadMode): number => {
  const limit = loadMode === 'manual' ? MANUAL_PREVIEW_BYTES : AUTO_PREVIEW_BYTES;

  if (typeof size !== 'number' || size <= 0) {
    return limit;
  }

  return Math.min(size, limit);
};
