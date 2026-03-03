import React from 'react';
import { Calendar, Download, Expand, FileIcon, Hash, Trash2, X } from 'lucide-react';
import ObjectPreview from '@/components/ObjectPreview';
import { PreviewActions, PreviewState, S3Object } from '@/types';

interface Props {
  object: S3Object;
  onClose: () => void;
  onDelete: (key: string) => void;
  onDownload: (key: string) => void;
  preview: PreviewState;
  previewActions: PreviewActions;
  onOpenViewer: () => void;
  isViewerOpen: boolean;
}

const formatSize = (bytes?: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileDetails: React.FC<Props> = ({
  object,
  onClose,
  onDelete,
  onDownload,
  preview,
  previewActions,
  onOpenViewer,
  isViewerOpen,
}) => {
  const objectType = object.key.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-2 text-white">
          <span className="font-bold text-sm tracking-wide uppercase">Properties</span>
        </div>
        <div className="flex items-center gap-1">
          {!object.isFolder && (
            <button
              type="button"
              onClick={() => onDownload(object.key)}
              className="p-1.5 hover:bg-white/5 rounded-md text-[#666] hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {!isViewerOpen && (
            <button
              type="button"
              onClick={onOpenViewer}
              className="p-1.5 hover:bg-white/5 rounded-md text-[#666] hover:text-white transition-colors"
              title="Open in viewer"
            >
              <Expand className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(object.key)}
            className="p-1.5 hover:bg-red-500/10 rounded-md text-[#666] hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#222] mx-1" />
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-md text-[#666] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2">
        <div className="aspect-video bg-[#050505] border border-[#222] rounded-lg overflow-hidden flex items-center justify-center mb-4 relative group">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <ObjectPreview preview={preview} actions={previewActions} mode="compact" />
        </div>

        <div className="space-y-4">
          <div className="bg-[#111] p-2 rounded-md border border-[#222]">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#555] mb-2">
              <FileIcon className="w-3 h-3" /> Object Key
            </div>
            <div className="font-mono text-[12px] text-[#999]">
              {object.key}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#111] p-2 rounded-md border border-[#222]">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1">Type</div>
              <div className="font-mono text-[12px] text-[#999]">{objectType}</div>
            </div>
            <div className="bg-[#111] p-2 rounded-md border border-[#222]">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1">Size</div>
              <div className="font-mono text-[12px] text-[#999]">{formatSize(object.size)}</div>
            </div>
          </div>

          <div className="bg-[#111] p-2 rounded-md border border-[#222]">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#555] mb-2">
              <Calendar className="w-3 h-3" /> Last Modified
            </div>
            <div className="font-mono text-[12px] text-[#999]">
              {object.lastModified?.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#111] p-2 rounded-md border border-[#222]">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#555] mb-2">
              <Hash className="w-3 h-3" /> ETag
            </div>
            <div className="font-mono text-[10px] text-[#666] break-all">
              {object.etag?.replace(/"/g, '') || 'Calculating...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetails;
