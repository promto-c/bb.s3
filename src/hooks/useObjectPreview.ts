import { useEffect, useState } from 'react';
import { parseCsvPreview } from '@/preview/csvPreview';
import { buildHtmlPreview } from '@/preview/htmlPreview';
import { isMediaHandler, resolvePreviewHandler } from '@/preview/registry';
import { getPreviewFetchBytes, getPreviewLoadPolicy } from '@/preview/sizePolicy';
import { buildTextPreview } from '@/preview/textPreview';
import { S3Service } from '@/services/s3Service';
import { PreviewActions, PreviewContent, PreviewState, S3Object } from '@/types';

interface CachedPreviewEntry {
  content: PreviewContent;
  isTruncated: boolean;
  message: string | null;
}

const EMPTY_PREVIEW_STATE: PreviewState = {
  handlerId: 'unsupported',
  status: 'idle',
  downloadUrl: null,
  content: null,
  message: null,
  blockedReason: null,
  canManualLoad: false,
  isTruncated: false,
  error: null,
};

const previewCache = new Map<string, CachedPreviewEntry>();

const getBlockedMessage = (blockedReason: PreviewState['blockedReason']): string | null => {
  switch (blockedReason) {
    case 'manual':
      return 'This preview is available on demand. Load it when you want to inspect the file inline.';
    case 'too-large':
      return 'Inline preview is disabled for files larger than 2 MB. Use download instead.';
    case 'unsupported':
      return 'This file type does not have an inline preview handler yet.';
    default:
      return null;
  }
};

const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && error.name === 'AbortError';
};

const createBaseState = (handlerId: PreviewState['handlerId']): PreviewState => ({
  handlerId,
  status: 'idle',
  downloadUrl: null,
  content: null,
  message: null,
  blockedReason: null,
  canManualLoad: false,
  isTruncated: false,
  error: null,
});

export const useObjectPreview = (
  selectedObject: S3Object | null,
  selectedBucket: string | null,
  s3Service: S3Service | null
): { preview: PreviewState; actions: PreviewActions } => {
  const [preview, setPreview] = useState<PreviewState>(EMPTY_PREVIEW_STATE);
  const [manualRequested, setManualRequested] = useState(false);

  const objectKey = selectedObject?.key ?? null;

  useEffect(() => {
    setManualRequested(false);
  }, [objectKey]);

  useEffect(() => {
    if (!selectedObject || selectedObject.isFolder || !selectedBucket || !s3Service) {
      setPreview(EMPTY_PREVIEW_STATE);
      return;
    }

    const handlerId = resolvePreviewHandler(selectedObject.key);
    const baseState = createBaseState(handlerId);
    const policy = getPreviewLoadPolicy(handlerId, selectedObject.size, manualRequested);
    const abortController = new AbortController();
    let cancelled = false;

    const updateDownloadUrl = async () => {
      try {
        const downloadUrl = await s3Service.getFileUrl(selectedBucket, selectedObject.key);
        if (cancelled) {
          return;
        }

        setPreview((current) => ({
          ...current,
          downloadUrl,
        }));
      } catch (error) {
        if (cancelled || isAbortError(error)) {
          return;
        }
      }
    };

    if (isMediaHandler(handlerId)) {
      setPreview({
        ...baseState,
        status: 'loading',
      });

      s3Service.getFileUrl(selectedBucket, selectedObject.key)
        .then((url) => {
          if (cancelled) {
            return;
          }

          setPreview({
            ...baseState,
            status: 'ready',
            downloadUrl: url,
            content: {
              kind: 'media',
              mediaType: handlerId,
              url,
            },
          });
        })
        .catch((error) => {
          if (cancelled || isAbortError(error)) {
            return;
          }

          const message = error instanceof Error ? error.message : 'Failed to load preview';
          setPreview({
            ...baseState,
            status: 'error',
            error: message,
            message: 'Failed to load preview.',
          });
        });

      return () => {
        cancelled = true;
        abortController.abort();
      };
    }

    updateDownloadUrl();

    if (policy.blockedReason) {
      setPreview({
        ...baseState,
        status: 'blocked',
        blockedReason: policy.blockedReason,
        canManualLoad: policy.canManualLoad,
        message: getBlockedMessage(policy.blockedReason),
      });

      return () => {
        cancelled = true;
        abortController.abort();
      };
    }

    const loadMode = policy.loadMode || 'auto';
    const cacheKey = `${selectedBucket}:${selectedObject.key}:${handlerId}:${loadMode}`;
    const cachedPreview = previewCache.get(cacheKey);

    if (cachedPreview) {
      setPreview((current) => ({
        ...baseState,
        status: 'ready',
        downloadUrl: current.downloadUrl,
        content: cachedPreview.content,
        message: cachedPreview.message,
        isTruncated: cachedPreview.isTruncated,
      }));

      return () => {
        cancelled = true;
        abortController.abort();
      };
    }

    setPreview({
      ...baseState,
      status: 'loading',
    });

    const fetchBytes = getPreviewFetchBytes(selectedObject.size, loadMode);

    const loadStructuredPreview = async () => {
      try {
        const bytes = await s3Service.getFileRange(selectedBucket, selectedObject.key, fetchBytes, abortController.signal);

        if (cancelled) {
          return;
        }

        let nextPreview: CachedPreviewEntry;

        if (handlerId === 'html') {
          const result = buildHtmlPreview(bytes, {
            byteLimit: fetchBytes,
            objectSize: selectedObject.size,
          });

          nextPreview = {
            content: result.content,
            isTruncated: result.isTruncated,
            message: result.message,
          };
        } else if (handlerId === 'text') {
          const result = buildTextPreview(bytes, {
            key: selectedObject.key,
            byteLimit: fetchBytes,
            objectSize: selectedObject.size,
          });

          nextPreview = {
            content: result.content,
            isTruncated: result.isTruncated,
            message: result.message,
          };
        } else {
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const rawText = decoder.decode(bytes);
          const result = await parseCsvPreview(rawText, selectedObject.key);

          nextPreview = {
            content: result.content,
            isTruncated: result.isTruncated,
            message: result.message,
          };
        }

        if (cancelled) {
          return;
        }

        previewCache.set(cacheKey, nextPreview);

        setPreview((current) => ({
          ...baseState,
          status: 'ready',
          downloadUrl: current.downloadUrl,
          content: nextPreview.content,
          message: nextPreview.message,
          isTruncated: nextPreview.isTruncated,
        }));
      } catch (error) {
        if (cancelled || isAbortError(error)) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load preview';

        setPreview((current) => ({
          ...baseState,
          status: 'error',
          downloadUrl: current.downloadUrl,
          error: message,
          message: 'Failed to load preview.',
        }));
      }
    };

    loadStructuredPreview();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [manualRequested, selectedBucket, selectedObject, s3Service]);

  const actions: PreviewActions = preview.canManualLoad
    ? {
        loadPreview: () => setManualRequested(true),
      }
    : {};

  return {
    preview,
    actions,
  };
};
