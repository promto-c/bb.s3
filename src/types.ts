export interface S3Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket?: string;
}

export interface SavedConnection extends Omit<S3Config, 'secretAccessKey'> {
  id: string;
  name?: string;
  lastUsed: number;
  pinned: boolean;
  secretAccessKey?: string;
}

export interface S3Object {
  key: string;
  lastModified?: Date;
  size?: number;
  etag?: string;
  url?: string; // Signed URL for preview
  isFolder: boolean;
}

export type PreviewKind = 'image' | 'video' | 'unsupported';

export interface PreviewState {
  kind: PreviewKind;
  previewable: boolean;
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Bucket {
  name: string;
  creationDate?: Date;
}

export type ViewMode = 'grid' | 'list';

export interface Breadcrumb {
  label: string;
  prefix: string;
}
