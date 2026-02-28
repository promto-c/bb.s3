import React from 'react';
import { Calendar, Download, Expand, FileIcon, Hash, Trash2, X } from 'lucide-react';
import ObjectPreview from '@/components/ObjectPreview';
import { PreviewActions, PreviewState, S3Object } from '@/types';

interface Props {
  object: S3Object;
  onClose: () => void;
  onDelete: (key: string) => void;
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
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded-md text-[#666] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2">
        <div className="aspect-video bg-[#050505] border border-[#222] rounded-lg overflow-hidden flex items-center justify-center mb-4 relative group">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px]"></div>
          {!isViewerOpen && (
            <button
              type="button"
              onClick={onOpenViewer}
              className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-black/60 hover:bg-black/80 text-white border border-white/10 backdrop-blur-md transition-colors"
            >
              <Expand className="w-3 h-3" />
              Open Viewer
            </button>
          )}
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

      <div className="mt-4 pt-4 border-t border-[#222] flex flex-col gap-2.5 shrink-0">
        {preview.downloadUrl && (
          <a
            href={preview.downloadUrl}
            download
            className="group flex items-center justify-center gap-2.5 w-full h-9 rounded-md border border-[#222] bg-[#111] hover:bg-[#1a1a1a] hover:border-[#333] text-white text-[12px] font-medium transition-all duration-200 no-underline shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          >
            <Download className="w-4 h-4 text-[#888] group-hover:text-white transition-colors" />
            Download Object
          </a>
        )}
        <button
          type="button"
          onClick={() => onDelete(object.key)}
          className="group flex items-center justify-center gap-2.5 w-full h-9 rounded-md border border-red-500/20 bg-red-950/10 hover:bg-red-900/20 hover:border-red-500/30 text-red-500 text-[12px] font-medium transition-all duration-200"
        >
          <Trash2 className="w-4 h-4 opacity-75 group-hover:opacity-100 transition-opacity" />
          Purge Object
        </button>
      </div>
    </div>
  );
};

export default FileDetails;
