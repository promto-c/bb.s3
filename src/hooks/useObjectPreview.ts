import { useEffect, useState } from 'react';
import { S3Service } from '@/services/s3Service';
import { PreviewState, S3Object } from '@/types';
import { getPreviewKind } from '@/utils/assetPreview';

interface PreviewFetchState {
  key: string | null;
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_FETCH_STATE: PreviewFetchState = {
  key: null,
  url: null,
  isLoading: false,
  error: null,
};

const EMPTY_PREVIEW_STATE: PreviewState = {
  kind: 'unsupported',
  previewable: false,
  url: null,
  isLoading: false,
  error: null,
};

export const useObjectPreview = (
  selectedObject: S3Object | null,
  selectedBucket: string | null,
  s3Service: S3Service | null
): PreviewState => {
  const [fetchState, setFetchState] = useState<PreviewFetchState>(EMPTY_FETCH_STATE);

  const objectKey = selectedObject?.key ?? null;
  const kind = selectedObject && !selectedObject.isFolder ? getPreviewKind(selectedObject.key) : 'unsupported';
  const previewable = Boolean(selectedObject && !selectedObject.isFolder && kind !== 'unsupported');
  const shouldFetch = Boolean(previewable && objectKey && selectedBucket && s3Service);
  const hasCurrentState = fetchState.key === objectKey;

  useEffect(() => {
    if (!shouldFetch || !objectKey || !selectedBucket || !s3Service) {
      setFetchState(EMPTY_FETCH_STATE);
      return;
    }

    let cancelled = false;

    setFetchState({
      key: objectKey,
      url: null,
      isLoading: true,
      error: null,
    });

    s3Service.getFileUrl(selectedBucket, objectKey)
      .then((url) => {
        if (cancelled) return;
        setFetchState({
          key: objectKey,
          url,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load preview';
        setFetchState({
          key: objectKey,
          url: null,
          isLoading: false,
          error: message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [objectKey, selectedBucket, s3Service, shouldFetch]);

  if (!selectedObject || selectedObject.isFolder) {
    return EMPTY_PREVIEW_STATE;
  }

  if (!previewable) {
    return {
      kind,
      previewable: false,
      url: null,
      isLoading: false,
      error: null,
    };
  }

  return {
    kind,
    previewable: true,
    url: hasCurrentState ? fetchState.url : null,
    isLoading: hasCurrentState ? fetchState.isLoading : true,
    error: hasCurrentState ? fetchState.error : null,
  };
};
