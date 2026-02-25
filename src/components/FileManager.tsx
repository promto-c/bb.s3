import React, { useState, useRef } from 'react';
import { S3Object } from '@/types';
import { 
  Folder, FileImage, Upload, 
  RefreshCw, Plus, LayoutGrid, List, File, FileCode, Film, Music, FolderPlus,
  ChevronLeft, Menu
} from 'lucide-react';
import BreadcrumbNav from '@/components/BreadcrumbNav';

interface Props {
  objects: S3Object[];
  currentPrefix: string;
  isLoading?: boolean;
  onNavigate: (prefix: string) => void;
  onUpload: (files: File[]) => void;
  onCreateFolder: (path: string) => void | Promise<void>;
  onDelete: (key: string) => void;
  onSelect: (object: S3Object) => void;
  selectedObject: S3Object | null;
  bucketName: string;
  onToggleSidebar?: () => void;
}

type ViewMode = 'grid' | 'list';

const FileManager: React.FC<Props> = ({
  objects, currentPrefix, isLoading, onNavigate, onUpload, onCreateFolder, onDelete, onSelect, selectedObject, bucketName, onToggleSidebar
}) => {
  const [dragCount, setDragCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileBadge = (key: string) => {
      if (key.endsWith('/')) return 'FOLDER';
      const ext = key.split('.').pop()?.toUpperCase() || 'FILE';
      return ext.length > 5 ? 'FILE' : ext;
  };

  const getFileIcon = (key: string) => {
      if (key.endsWith('/')) return <Folder className="w-5 h-5 text-white" />;
      const ext = key.split('.').pop()?.toLowerCase();
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) 
        return <FileImage className="w-5 h-5 text-blue-400" />;
      if (['mp4', 'mov', 'webm'].includes(ext || '')) 
        return <Film className="w-5 h-5 text-purple-400" />;
      if (['mp3', 'wav', 'ogg'].includes(ext || '')) 
        return <Music className="w-5 h-5 text-green-400" />;
      if (['js', 'ts', 'json', 'html', 'css', 'py'].includes(ext || '')) 
        return <FileCode className="w-5 h-5 text-yellow-400" />;
      
      return <File className="w-5 h-5 text-gray-400" />;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCount(0);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
      e.target.value = '';
    }
  };

  const navigateUp = () => {
      if (!currentPrefix) return;
      const parts = currentPrefix.split('/').filter(Boolean);
      parts.pop();
      const newPrefix = parts.length > 0 ? parts.join('/') + '/' : '';
      onNavigate(newPrefix);
  };

  const openCreateFolderDialog = () => {
    setNewFolderPath('');
    setIsCreateFolderOpen(true);
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = newFolderPath.trim();
    if (!path) return;

    await onCreateFolder(path);
    setIsCreateFolderOpen(false);
    setNewFolderPath('');
  };

  return (
    <div
      className="flex flex-col h-full relative"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => { e.preventDefault(); setDragCount(c => c + 1); }}
      onDragLeave={() => setDragCount(c => Math.max(0, c - 1))}
    >
      {/* Drag Overlay */}
      {dragCount > 0 && (
        <div className="absolute inset-4 z-50 rounded-xl border-2 border-dashed border-blue-500 bg-[#0a0a0a]/90 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Upload className="w-10 h-10 text-blue-500 mb-3 mx-auto" />
            <span className="text-base font-medium text-white">Drop to upload</span>
          </div>
        </div>
      )}

      {/* Modern Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[#1f1f1f] bg-[#0a0a0a]/50 backdrop-blur-md shrink-0 z-20">
         <div className="header-left flex items-center gap-4 flex-1 min-w-0">
             {/* Navigation Controls */}
             <div className="flex items-center">
                {onToggleSidebar && (
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="icon-btn mobile-only"
                        title="Buckets"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={navigateUp}
                    disabled={!currentPrefix}
                    title="Go Back"
                    className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:border-transparent border-[#222] bg-[#111] hover:bg-[#222] hover:border-[#333] text-white"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
             </div>

             <div className="nav-divider h-5 w-px bg-[#222]"></div>

             {/* Breadcrumbs */}
             <BreadcrumbNav
                bucketName={bucketName}
                currentPrefix={currentPrefix}
                onNavigate={onNavigate}
             />

             {/* Item count */}
             {!isLoading && objects.length > 0 && (() => {
                const folders = objects.filter(o => o.isFolder).length;
                const files = objects.filter(o => !o.isFolder).length;
                const parts = [];
                if (folders) parts.push(`${folders} folder${folders !== 1 ? 's' : ''}`);
                if (files) parts.push(`${files} file${files !== 1 ? 's' : ''}`);
                return (
                    <span className="text-[10px] font-mono text-[#444] whitespace-nowrap shrink-0">
                        {parts.join(', ')}
                    </span>
                );
             })()}
         </div>

         {/* Actions */}
         <div className="action-bar">
            <div className="flex bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-1 gap-1 mr-4">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#222] text-white' : 'text-[#555] hover:text-[#999]'}`}
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#222] text-white' : 'text-[#555] hover:text-[#999]'}`}
                >
                    <List className="w-3.5 h-3.5" />
                </button>
            </div>
            
            <button
                onClick={() => onNavigate(currentPrefix)}
                className={`icon-btn${isLoading ? ' animate-spin' : ''}`}
                title="Sync"
                disabled={isLoading}
            >
                <RefreshCw className="w-3.5 h-3.5" />
            </button>
            
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} multiple />
            <button
                onClick={openCreateFolderDialog}
                className="btn"
                title="Create Folder"
            >
                <FolderPlus className="w-3.5 h-3.5" /> New Folder
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
            >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Upload
            </button>
        </div>
      </header>

      {/* Content */}
      <div className={`content-area ${isLoading && objects.length === 0 ? '' : viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
            {isLoading && objects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[220px]">
                    <div className="loading-ring mb-4">
                        <div></div><div></div><div></div>
                    </div>
                    <p className="text-xs text-[#555] font-mono tracking-wide">Fetching objects...</p>
                </div>
            ) : (
                <>
                {objects.map((obj, idx) => (
                <div
                    key={obj.key}
                    onClick={() => obj.isFolder ? onNavigate(obj.key) : onSelect(obj)}
                    className={`file-card ${selectedObject?.key === obj.key ? 'active' : ''}`}
                    style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                >
                    <div className="flex items-center gap-3 w-full">
                        {/* Icon */}
                        <div className="file-icon-box">
                            {getFileIcon(obj.key)}
                        </div>

                        {/* Name (for list view primarily, but used structure for grid too via CSS) */}
                         <div className="file-info">
                            <div className="file-name">
                                {obj.key.replace(currentPrefix, '').replace(/\/$/, '')}
                            </div>
                         </div>
                    </div>

                    {/* Footer / Meta */}
                    <div className="file-meta-row">
                        <span className="badge">{getFileBadge(obj.key)}</span>
                        <span>{formatSize(obj.size)}</span>
                    </div>
                </div>
            ))}
            
            {objects.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-6 text-[#444] border border-dashed border-[#222] rounded-xl h-[220px]">
                    <div className="w-10 h-10 bg-[#111] rounded-full flex items-center justify-center mb-3">
                        <Folder className="w-4 h-4 opacity-50" />
                    </div>
                    <p className="text-sm">Folder is empty</p>
                </div>
            )}

            {/* Loading more pages indicator */}
            {isLoading && objects.length > 0 && (
                <div className="col-span-full flex items-center justify-center gap-2 py-4 text-[#555] text-xs font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Loading more items...</span>
                </div>
            )}
                </>
            )}
      </div>

      {isCreateFolderOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolderSubmit}
            className="w-full max-w-md bg-[#0a0a0a] border border-[#222] rounded-xl p-4 shadow-2xl space-y-3"
          >
            <div className="text-sm font-semibold text-white">Create Folder</div>
            <div className="text-xs text-[#777]">
              Enter a folder name or nested path. Use leading "/" for bucket root.
            </div>
            <input
              autoFocus
              type="text"
              className="onyx-input"
              placeholder={currentPrefix ? `${currentPrefix}new-folder` : 'new-folder'}
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setIsCreateFolderOpen(false);
                  setNewFolderPath('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!newFolderPath.trim()}
              >
                <FolderPlus className="w-3.5 h-3.5" /> Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FileManager;
