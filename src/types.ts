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

export type PreviewHandlerId = 'image' | 'video' | 'csv' | 'text' | 'unsupported';
export type PreviewStatus = 'idle' | 'loading' | 'ready' | 'blocked' | 'error';
export type PreviewBlockedReason = 'manual' | 'too-large' | 'unsupported' | null;
export type PreviewLoadMode = 'auto' | 'manual';

export interface PreviewMediaContent {
  kind: 'media';
  mediaType: 'image' | 'video';
  url: string;
}

export interface PreviewTextContent {
  kind: 'text';
  text: string;
  lineCount: number;
  truncated: boolean;
  language: string | null;
}

export interface PreviewTableContent {
  kind: 'table';
  columns: string[];
  rows: string[][];
  truncatedRows: boolean;
  truncatedColumns: boolean;
  rawText: string;
  delimiter: ',' | '\t';
}

export type PreviewContent = PreviewMediaContent | PreviewTextContent | PreviewTableContent;

export interface PreviewState {
  handlerId: PreviewHandlerId;
  status: PreviewStatus;
  downloadUrl: string | null;
  content: PreviewContent | null;
  message: string | null;
  blockedReason: PreviewBlockedReason;
  canManualLoad: boolean;
  isTruncated: boolean;
  error: string | null;
}

export interface PreviewActions {
  loadPreview?: () => void;
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
