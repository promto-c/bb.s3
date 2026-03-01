import { describe, expect, it } from 'vitest';
import { AUTO_PREVIEW_BYTES, MANUAL_PREVIEW_BYTES } from '@/preview/constants';
import { getPreviewFetchBytes, getPreviewLoadPolicy } from '@/preview/sizePolicy';

describe('getPreviewLoadPolicy', () => {
  it('auto-loads media regardless of file size', () => {
    expect(getPreviewLoadPolicy('image', MANUAL_PREVIEW_BYTES + 1, false)).toEqual({
      blockedReason: null,
      canManualLoad: false,
      loadMode: 'auto',
    });
  });

  it('auto-loads splat previews regardless of file size', () => {
    expect(getPreviewLoadPolicy('splat', MANUAL_PREVIEW_BYTES + 1, false)).toEqual({
      blockedReason: null,
      canManualLoad: false,
      loadMode: 'auto',
    });
  });

  it('requires manual load for mid-sized text previews', () => {
    expect(getPreviewLoadPolicy('text', AUTO_PREVIEW_BYTES + 1024, false)).toEqual({
      blockedReason: 'manual',
      canManualLoad: true,
      loadMode: null,
    });
  });

  it('unlocks manual text previews after the user requests them', () => {
    expect(getPreviewLoadPolicy('text', AUTO_PREVIEW_BYTES + 1024, true)).toEqual({
      blockedReason: null,
      canManualLoad: false,
      loadMode: 'manual',
    });
  });

  it('blocks text previews over the hard size limit', () => {
    expect(getPreviewLoadPolicy('csv', MANUAL_PREVIEW_BYTES + 1, false)).toEqual({
      blockedReason: 'too-large',
      canManualLoad: false,
      loadMode: null,
    });
  });
});

describe('getPreviewFetchBytes', () => {
  it('caps automatic preview loads to the automatic limit', () => {
    expect(getPreviewFetchBytes(AUTO_PREVIEW_BYTES + 2048, 'auto')).toBe(AUTO_PREVIEW_BYTES);
  });

  it('caps manual preview loads to the manual limit', () => {
    expect(getPreviewFetchBytes(MANUAL_PREVIEW_BYTES + 2048, 'manual')).toBe(MANUAL_PREVIEW_BYTES);
  });
});
