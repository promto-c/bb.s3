import React, { useState, useEffect } from 'react';
import { S3Object } from '@/types';
import { X, Download, Trash2, FileIcon, Calendar, Hash } from 'lucide-react';
import { S3Service } from '@/services/s3Service';

interface Props {
  object: S3Object;
  bucketName: string;
  onClose: () => void;
  s3Service: S3Service;
  onDelete: (key: string) => void;
}

const FileDetails: React.FC<Props> = ({ object, bucketName, onClose, s3Service, onDelete }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    s3Service.getFileUrl(bucketName, object.key).then(url => {
        if(mounted) setPreviewUrl(url);
    });

    return () => { mounted = false; };
  }, [object, bucketName, s3Service]);

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i.test(object.key);
  const isVideo = /\.(mp4|mov|webm|m4v|ogv|avi|mkv)$/i.test(object.key);

  // Helper for file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-2 text-white">
             <span className="font-bold text-sm tracking-wide uppercase">Properties</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/5 rounded-md text-[#666] hover:text-white transition-colors"
          >
              <X className="w-4 h-4" />
          </button>
      </div>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2">
        {/* Preview Area */}
        {isImage && previewUrl ? (
            <div className="aspect-video bg-[#050505] border border-[#222] rounded-lg overflow-hidden flex items-center justify-center mb-4 relative group">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain relative z-10 shadow-2xl" />
            </div>
        ) : isVideo && previewUrl ? (
            <div className="aspect-video bg-[#050505] border border-[#222] rounded-lg overflow-hidden flex items-center justify-center mb-4 relative group">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <video
                    src={previewUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain relative z-10"
                >
                    Your browser does not support video playback.
                </video>
            </div>
        ) : (
            <div className="aspect-[3/2] bg-[#050505] border border-[#222] rounded-lg flex flex-col items-center justify-center mb-4 gap-2">
                <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-[#444]" />
                </div>
                <span className="text-xs text-[#555] font-mono">No Preview Available</span>
            </div>
        )}

        {/* Data Grid */}
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
                    <div className="font-mono text-[12px] text-[#999]">
                        {object.key.split('.').pop()?.toUpperCase() || 'FILE'}
                    </div>
                </div>
                <div className="bg-[#111] p-2 rounded-md border border-[#222]">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-[#555] mb-1">Size</div>
                    <div className="font-mono text-[12px] text-[#999]">
                        {formatSize(object.size)}
                    </div>
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

      {/* Footer Actions */}
      <div className="mt-4 pt-4 border-t border-[#222] flex flex-col gap-2.5 shrink-0">
            {previewUrl && (
                <a 
                    href={previewUrl} 
                    download
                    className="group flex items-center justify-center gap-2.5 w-full h-9 rounded-md border border-[#222] bg-[#111] hover:bg-[#1a1a1a] hover:border-[#333] text-white text-[12px] font-medium transition-all duration-200 no-underline shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                >
                    <Download className="w-4 h-4 text-[#888] group-hover:text-white transition-colors" /> 
                    Download Object
                </a>
            )}
            <button 
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
