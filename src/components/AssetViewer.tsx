import React, { useEffect } from 'react';
import { Calendar, Download, FileIcon, Hash, Trash2, X } from 'lucide-react';
import { PreviewState, S3Object } from '@/types';

interface Props {
  object: S3Object | null;
  bucketName: string | null;
  preview: PreviewState;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (key: string) => void;
  layout: 'split' | 'stacked';
}

const formatSize = (bytes?: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getObjectType = (key: string) => key.split('.').pop()?.toUpperCase() || 'FILE';

const AssetViewer: React.FC<Props> = ({ object, bucketName, preview, isOpen, onClose, onDelete, layout }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const renderStage = () => {
    if (!object) {
      return (
        <div className="asset-viewer-empty">
          <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center mb-3">
            <FileIcon className="w-5 h-5 text-[#555]" />
          </div>
          <p className="text-sm text-white">Viewer stays open</p>
          <p className="text-xs text-[#666] font-mono mt-2 text-center max-w-sm">
            Select a file from {bucketName || 'the current bucket'} to load its preview here.
          </p>
        </div>
      );
    }

    if (preview.isLoading) {
      return (
        <div className="asset-viewer-empty">
          <div className="loading-ring mb-4">
            <div></div><div></div><div></div>
          </div>
          <p className="text-sm text-[#666] font-mono tracking-wide">Loading preview...</p>
        </div>
      );
    }

    if (preview.error) {
      return (
        <div className="asset-viewer-empty">
          <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center mb-3">
            <FileIcon className="w-5 h-5 text-[#555]" />
          </div>
          <p className="text-sm text-white">Preview unavailable</p>
          <p className="text-xs text-[#666] font-mono mt-2 text-center max-w-sm">{preview.error}</p>
        </div>
      );
    }

    if (preview.kind === 'image' && preview.url) {
      return <img src={preview.url} alt={object.key} className="asset-viewer-media image" />;
    }

    if (preview.kind === 'video' && preview.url) {
      return (
        <video
          src={preview.url}
          controls
          playsInline
          preload="metadata"
          className="asset-viewer-media video"
        >
          Your browser does not support video playback.
        </video>
      );
    }

    return (
      <div className="asset-viewer-empty">
        <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center mb-3">
          <FileIcon className="w-5 h-5 text-[#555]" />
        </div>
        <p className="text-sm text-white">No preview available</p>
      </div>
    );
  };

  const objectName = object?.key.split('/').filter(Boolean).pop() || object?.key || 'No file selected';

  return (
    <section
      className={`asset-viewer-pane${isOpen ? ' open' : ''}`}
      aria-hidden={!isOpen}
      data-layout={layout}
    >
      <div className="asset-viewer-surface">
        <div className="asset-viewer-stage">
          <div className="asset-viewer-header">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#666] font-semibold">Asset Viewer</div>
              <div className="asset-viewer-title">{objectName}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="asset-viewer-canvas">
            <div className="asset-viewer-grid"></div>
            {renderStage()}
          </div>
        </div>

        <aside className="asset-viewer-meta">
          {object ? (
            <>
              <div className="space-y-4">
                <div className="bg-[#111] p-3 rounded-md border border-[#222]">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#555] mb-2">
                    <FileIcon className="w-3 h-3" /> Object Key
                  </div>
                  <div className="font-mono text-[12px] text-[#999] break-all">{object.key}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#111] p-3 rounded-md border border-[#222]">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1">Type</div>
                    <div className="font-mono text-[12px] text-[#999]">{getObjectType(object.key)}</div>
                  </div>
                  <div className="bg-[#111] p-3 rounded-md border border-[#222]">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1">Size</div>
                    <div className="font-mono text-[12px] text-[#999]">{formatSize(object.size)}</div>
                  </div>
                </div>

                <div className="bg-[#111] p-3 rounded-md border border-[#222]">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#555] mb-2">
                    <Calendar className="w-3 h-3" /> Last Modified
                  </div>
                  <div className="font-mono text-[12px] text-[#999]">{object.lastModified?.toLocaleString()}</div>
                </div>

                <div className="bg-[#111] p-3 rounded-md border border-[#222]">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#555] mb-2">
                    <Hash className="w-3 h-3" /> ETag
                  </div>
                  <div className="font-mono text-[10px] text-[#666] break-all">
                    {object.etag?.replace(/"/g, '') || 'Calculating...'}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-[#222] flex flex-col gap-2.5 shrink-0">
                {preview.url && (
                  <a
                    href={preview.url}
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
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#111] p-3 rounded-md border border-[#222]">
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-2">Current Bucket</div>
                <div className="font-mono text-[12px] text-[#999] break-all">{bucketName || 'No bucket selected'}</div>
              </div>

              <div className="bg-[#111] p-3 rounded-md border border-[#222]">
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-2">Status</div>
                <div className="font-mono text-[12px] text-[#999]">
                  Asset viewer remains open until you close it.
                </div>
              </div>

              <div className="bg-[#111] p-3 rounded-md border border-[#222]">
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-2">Next Step</div>
                <div className="font-mono text-[12px] text-[#999]">
                  Pick another file or change bucket. The viewer panel will reuse this same space.
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default AssetViewer;
