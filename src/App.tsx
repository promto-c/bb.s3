import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, Undo2 } from 'lucide-react';
import { Bucket, S3Config, S3Object } from '@/types';
import { S3Service } from '@/services/s3Service';
import { useObjectPreview } from '@/hooks/useObjectPreview';
import ConnectionForm from '@/components/ConnectionForm';
import BucketList from '@/components/BucketList';
import FileManager from '@/components/FileManager';
import FileDetails from '@/components/FileDetails';
import AssetViewer from '@/components/AssetViewer';

const DEFAULT_VIEWER_WIDTH = 720;
const MIN_VIEWER_WIDTH = 420;
const MIN_BROWSER_WIDTH = 360;
const STACKED_VIEWER_THRESHOLD = 760;

const clampViewerWidth = (nextWidth: number, workspaceWidth: number) => {
  const maxWidth = Math.max(MIN_VIEWER_WIDTH, workspaceWidth - MIN_BROWSER_WIDTH);
  return Math.min(Math.max(nextWidth, MIN_VIEWER_WIDTH), maxWidth);
};

const App: React.FC = () => {
  const [s3Config, setS3Config] = useState<S3Config | null>(null);
  const [s3Service, setS3Service] = useState<S3Service | null>(null);

  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  const [currentObjects, setCurrentObjects] = useState<S3Object[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [selectedObject, setSelectedObject] = useState<S3Object | null>(null);
  const [isAssetViewerOpen, setIsAssetViewerOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error', exiting?: boolean, actionLabel?: string, onAction?: () => void} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{msg: string, resolve: (v: boolean) => void} | null>(null);
  const [viewerPaneWidth, setViewerPaneWidth] = useState(DEFAULT_VIEWER_WIDTH);
  const [isViewerResizing, setIsViewerResizing] = useState(false);

  const pendingDeleteRef = useRef<{key: string, bucket: string, timeoutId: ReturnType<typeof setTimeout>} | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const viewerResizeRef = useRef<{startX: number, startWidth: number} | null>(null);
  const [topoLines, setTopoLines] = useState<number[]>([]);

  const selectedFile = selectedObject && !selectedObject.isFolder ? selectedObject : null;
  const { preview: previewState, actions: previewActions } = useObjectPreview(selectedFile, selectedBucket, s3Service);
  const inspectorOpen = Boolean(selectedFile);
  const viewerOpen = Boolean(selectedBucket && isAssetViewerOpen);
  const viewerLayout = viewerPaneWidth < STACKED_VIEWER_THRESHOLD ? 'stacked' : 'split';

  useEffect(() => {
    setTopoLines(Array.from({ length: 15 }, (_, i) => i));
  }, []);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      setViewerPaneWidth((prev) => clampViewerWidth(prev, entry.contentRect.width));
    });

    observer.observe(workspace);
    return () => observer.disconnect();
  }, [selectedBucket]);

  useEffect(() => {
    if (!isViewerResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = viewerResizeRef.current;
      const workspace = workspaceRef.current;
      if (!resizeState || !workspace) return;

      const nextWidth = resizeState.startWidth + (resizeState.startX - event.clientX);
      setViewerPaneWidth(clampViewerWidth(nextWidth, workspace.clientWidth));
    };

    const stopResizing = () => {
      viewerResizeRef.current = null;
      setIsViewerResizing(false);
    };

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);
    window.addEventListener('pointercancel', stopResizing);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
      window.removeEventListener('pointercancel', stopResizing);
    };
  }, [isViewerResizing]);

  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifExitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = (msg: string, type: 'success'|'error', opts?: {actionLabel?: string, onAction?: () => void, duration?: number}) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    if (notifExitRef.current) clearTimeout(notifExitRef.current);
    const duration = opts?.duration ?? 3000;
    setNotification({ msg, type, actionLabel: opts?.actionLabel, onAction: opts?.onAction });
    notifTimerRef.current = setTimeout(() => {
      setNotification(prev => prev ? { ...prev, exiting: true } : null);
      notifExitRef.current = setTimeout(() => setNotification(null), 250);
    }, duration);
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeAssetViewer = () => {
    viewerResizeRef.current = null;
    setIsViewerResizing(false);
    setIsAssetViewerOpen(false);
  };

  const resetViewerPaneWidth = useCallback(() => {
    const workspace = workspaceRef.current;
    if (!workspace) {
      setViewerPaneWidth(DEFAULT_VIEWER_WIDTH);
      return;
    }

    setViewerPaneWidth(clampViewerWidth(DEFAULT_VIEWER_WIDTH, workspace.clientWidth));
  }, []);

  const requestConfirm = (msg: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({ msg, resolve });
    });
  };

  const handleConnect = (config: S3Config) => {
    setIsLoading(true);
    const service = new S3Service(config);

    service.listBuckets()
      .then((bucketList) => {
        setS3Service(service);
        setS3Config(config);
        setBuckets(bucketList);
        setSelectedBucket(null);
        setCurrentObjects([]);
        setCurrentPrefix('');
        setSelectedObject(null);
        setIsAssetViewerOpen(false);
        setIsSidebarOpen(true);
        showNotification('Connected successfully!', 'success');
      })
      .catch((err) => {
        console.error(err);
        showNotification('Connection failed. Check credentials.', 'error');
      })
      .finally(() => setIsLoading(false));
  };

  const handleDisconnect = () => {
    setS3Config(null);
    setS3Service(null);
    setBuckets([]);
    setSelectedBucket(null);
    setCurrentObjects([]);
    setCurrentPrefix('');
    setSelectedObject(null);
    setIsAssetViewerOpen(false);
    setIsSidebarOpen(false);
    setIsLoading(false);
    showNotification('Disconnected', 'success');
  };

  const loadObjects = useCallback(async (bucket: string, prefix: string) => {
    if (!s3Service) return;
    setIsLoading(true);
    try {
      const objs = await s3Service.listObjects(bucket, prefix, (pageItems) => {
        setCurrentObjects(pageItems);
        setCurrentPrefix(prefix);
      });
      setCurrentObjects(objs);
      setCurrentPrefix(prefix);
    } catch (err) {
      console.error(err);
      showNotification('Failed to list objects', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [s3Service]);

  const handleNavigate = useCallback((prefix: string) => {
    if (!selectedBucket) return;

    if (prefix !== currentPrefix) {
      setSelectedObject(null);
    }

    loadObjects(selectedBucket, prefix);
  }, [currentPrefix, loadObjects, selectedBucket]);

  useEffect(() => {
    if (!selectedBucket) return;

    setCurrentObjects([]);
    setCurrentPrefix('');
    setSelectedObject(null);
    loadObjects(selectedBucket, '');
  }, [selectedBucket, loadObjects]);

  const handleBucketSelect = (bucket: string) => {
    setSelectedObject(null);
    setSelectedBucket(bucket);
    closeSidebar();
  };

  const handleCreateBucket = async (nameInput: string): Promise<boolean> => {
    if (!s3Service) return false;

    const name = nameInput.trim();
    if (!name) {
      showNotification('Bucket name cannot be empty', 'error');
      return false;
    }

    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(name)) {
      showNotification('Invalid bucket name format', 'error');
      return false;
    }

    try {
      await s3Service.createBucket(name);
      const bucketList = await s3Service.listBuckets();
      setBuckets(bucketList);
      setSelectedBucket(name);
      setSelectedObject(null);
      showNotification('Bucket created', 'success');
      return true;
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      showNotification(`Failed to create bucket: ${message}`, 'error');
      return false;
    }
  };

  const handleDeleteBucket = async (name: string) => {
    const confirmed = await requestConfirm(`Delete bucket "${name}"? All objects inside will be removed.`);
    if (!confirmed || !s3Service) return;

    try {
      await s3Service.deleteBucket(name);
      const bucketList = await s3Service.listBuckets();
      setBuckets(bucketList);
      if (selectedBucket === name) {
        setSelectedBucket(null);
        setCurrentObjects([]);
        setCurrentPrefix('');
        setSelectedObject(null);
      }
      showNotification('Bucket deleted', 'success');
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      showNotification(`Failed to delete bucket: ${message}`, 'error');
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!s3Service || !selectedBucket || files.length === 0) return;

    const total = files.length;
    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      showNotification(`Uploading ${total > 1 ? `(${uploaded + 1}/${total}) ` : ''}${file.name}...`, 'success');
      try {
        await s3Service.uploadFile(selectedBucket, currentPrefix + file.name, file);
        uploaded++;
      } catch (err) {
        console.error(`Upload failed for "${file.name}":`, err);
        failed++;
      }
    }

    await loadObjects(selectedBucket, currentPrefix);

    if (failed === 0) {
      showNotification(total === 1 ? 'File uploaded' : `${uploaded} files uploaded`, 'success');
    } else {
      showNotification(`${uploaded} uploaded, ${failed} failed`, failed === total ? 'error' : 'success');
    }
  };

  const handleCreateFolder = async (pathInput: string) => {
    if (!s3Service || !selectedBucket) return;

    const normalizedInput = pathInput
      .trim()
      .replace(/\\/g, '/')
      .replace(/\/{2,}/g, '/');

    if (!normalizedInput || normalizedInput === '/') {
      showNotification('Folder name cannot be empty', 'error');
      return;
    }

    const isAbsolutePath = normalizedInput.startsWith('/');
    const cleanedPath = normalizedInput
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');

    if (!cleanedPath) {
      showNotification('Folder name cannot be empty', 'error');
      return;
    }

    const folderKey = `${isAbsolutePath ? '' : currentPrefix}${cleanedPath}/`;

    try {
      await s3Service.createFolder(selectedBucket, folderKey);
      await loadObjects(selectedBucket, currentPrefix);
      showNotification('Folder created', 'success');
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      showNotification(`Failed to create folder: ${message}`, 'error');
    }
  };

  const handleDeleteObject = async (key: string) => {
    if (!s3Service || !selectedBucket) return;

    const confirmed = await requestConfirm(`Delete "${key.split('/').pop()}"?`);
    if (!confirmed) return;

    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timeoutId);
      const prev = pendingDeleteRef.current;
      s3Service.deleteObject(prev.bucket, prev.key).catch(() => {});
      pendingDeleteRef.current = null;
    }

    setCurrentObjects(prev => prev.filter(o => o.key !== key));
    if (selectedObject?.key === key) {
      setSelectedObject(null);
    }

    const bucket = selectedBucket;
    const prefix = currentPrefix;

    const undoDelete = () => {
      if (pendingDeleteRef.current?.key === key) {
        clearTimeout(pendingDeleteRef.current.timeoutId);
        pendingDeleteRef.current = null;
      }
      loadObjects(bucket, prefix);
      showNotification('Delete undone', 'success');
    };

    const timeoutId = setTimeout(async () => {
      pendingDeleteRef.current = null;
      try {
        await s3Service.deleteObject(bucket, key);
      } catch (e) {
        showNotification('Delete failed', 'error');
        loadObjects(bucket, prefix);
      }
    }, 5000);

    pendingDeleteRef.current = { key, bucket, timeoutId };

    const fileName = key.split('/').filter(Boolean).pop() || key;
    showNotification(`"${fileName}" deleted`, 'success', {
      actionLabel: 'Undo',
      onAction: undoDelete,
      duration: 5000
    });
  };

  const handleViewerResizeStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !viewerOpen) return;

    const workspace = workspaceRef.current;
    if (!workspace) return;

    viewerResizeRef.current = {
      startX: event.clientX,
      startWidth: clampViewerWidth(viewerPaneWidth, workspace.clientWidth),
    };
    setIsViewerResizing(true);
  };

  if (!s3Config) {
    return (
      <div className="relative h-screen w-screen flex flex-col items-center justify-center">
        <div className="topo-bg">
          {topoLines.map((i) => {
            const size = 300 + (i * 150);
            const delay = i * 0.5;
            return (
              <div
                key={i}
                className="topo-line"
                style={{ width: `${size}px`, height: `${size}px`, left: '50%', top: '50%', animationDelay: `${delay}s` }}
              ></div>
            );
          })}
        </div>
        {notification && (
          <div className={`notification-toast${notification.exiting ? ' toast-exit' : ''} fixed top-6 right-6 p-4 rounded-lg shadow-2xl z-50 text-white font-medium tracking-wide border ${notification.type === 'error' ? 'bg-red-900/50 border-red-800 text-red-100' : 'bg-green-900/50 border-green-800 text-green-100'} backdrop-blur-md`}>
            {notification.msg}
            <div className={`toast-progress ${notification.type === 'error' ? 'bg-red-500/40' : 'bg-emerald-400/40'}`}></div>
          </div>
        )}
        <ConnectionForm onConnect={handleConnect} isConnecting={isLoading} />
      </div>
    );
  }

  return (
    <div
      className="app-shell"
      data-sidebar-open={isSidebarOpen ? 'true' : 'false'}
      data-inspector-open={inspectorOpen ? 'true' : 'false'}
      data-asset-viewer-open={viewerOpen ? 'true' : 'false'}
      data-viewer-resizing={isViewerResizing ? 'true' : 'false'}
    >
      <div className="topo-bg">
        {topoLines.map((i) => {
          const size = 300 + (i * 150);
          const delay = i * 0.5;
          return (
            <div
              key={i}
              className="topo-line"
              style={{ width: `${size}px`, height: `${size}px`, left: '50%', top: '50%', animationDelay: `${delay}s` }}
            ></div>
          );
        })}
      </div>

      {notification && (
        <div className={`notification-toast${notification.exiting ? ' toast-exit' : ''} fixed top-6 right-6 px-6 py-3 rounded-lg shadow-2xl z-[100] font-medium flex items-center gap-3 backdrop-blur-xl border ${notification.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-100' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100'}`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'error' ? 'bg-red-500 box-shadow-red' : 'bg-emerald-400 box-shadow-emerald'}`}></div>
          {notification.msg}
          {notification.actionLabel && notification.onAction && (
            <button
              type="button"
              onClick={() => { notification.onAction?.(); }}
              className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              {notification.actionLabel}
            </button>
          )}
          <div className={`toast-progress ${notification.type === 'error' ? 'bg-red-500/40' : 'bg-emerald-400/40'}`} style={notification.actionLabel ? { animationDuration: '5s' } : undefined}></div>
        </div>
      )}

      <BucketList
        buckets={buckets}
        selectedBucket={selectedBucket}
        onSelect={handleBucketSelect}
        onCreate={handleCreateBucket}
        onDelete={handleDeleteBucket}
        onClose={closeSidebar}
        onDisconnect={handleDisconnect}
      />

      <main>
        {selectedBucket ? (
          <div
            ref={workspaceRef}
            className={`workspace-main${viewerOpen ? ' viewer-open' : ''}`}
            style={{ '--viewer-pane-width': `${viewerPaneWidth}px` } as React.CSSProperties}
          >
            <div className="browser-pane">
              <FileManager
                bucketName={selectedBucket}
                objects={currentObjects}
                currentPrefix={currentPrefix}
                isLoading={isLoading}
                onNavigate={handleNavigate}
                onUpload={handleUpload}
                onCreateFolder={handleCreateFolder}
                onDelete={handleDeleteObject}
                onSelect={setSelectedObject}
                selectedObject={selectedObject}
                onToggleSidebar={toggleSidebar}
              />
            </div>

            {selectedFile && viewerOpen && (
              <>
                <button
                  type="button"
                  className="viewer-splitter"
                  aria-label="Resize asset viewer"
                  title="Drag to resize asset viewer. Double-click to reset."
                  onPointerDown={handleViewerResizeStart}
                  onDoubleClick={resetViewerPaneWidth}
                />
                <AssetViewer
                  object={selectedFile}
                  bucketName={selectedBucket}
                  preview={previewState}
                  previewActions={previewActions}
                  isOpen={viewerOpen}
                  onClose={closeAssetViewer}
                  onDelete={handleDeleteObject}
                  layout={viewerLayout}
                />
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-6 opacity-40 relative">
            <button
              type="button"
              onClick={toggleSidebar}
              className="icon-btn mobile-only absolute top-4 left-4 z-10"
              title="Buckets"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="w-24 h-24 border border-dashed border-white/20 rounded-2xl flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-xl font-light tracking-wide font-sans">Select a bucket to initiate</p>
          </div>
        )}
      </main>

      <button
        type="button"
        className="sidebar-scrim"
        aria-label="Close sidebar"
        onClick={closeSidebar}
      />

      <div className={`inspector transition-all duration-300 ease-in-out ${inspectorOpen ? 'open' : ''}`}>
        {selectedFile && selectedBucket && (
          <FileDetails
            object={selectedFile}
            onClose={() => setSelectedObject(null)}
            onDelete={handleDeleteObject}
            preview={previewState}
            previewActions={previewActions}
            onOpenViewer={() => setIsAssetViewerOpen(true)}
            isViewerOpen={viewerOpen}
          />
        )}
      </div>

      <button
        type="button"
        className="inspector-scrim"
        aria-label="Close file details"
        onClick={() => setSelectedObject(null)}
      />

      {viewerOpen && (
        <button
          type="button"
          className="asset-viewer-scrim"
          aria-label="Close asset viewer"
          onClick={closeAssetViewer}
        />
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-[#222] rounded-xl p-5 shadow-2xl space-y-4">
            <p className="text-sm text-[#ccc] leading-relaxed">{confirmModal.msg}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => { confirmModal.resolve(false); setConfirmModal(null); }}
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                className="group flex items-center justify-center gap-2 px-4 h-8 rounded-md border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 hover:border-red-500/50 text-red-400 text-xs font-semibold transition-all"
                onClick={() => { confirmModal.resolve(true); setConfirmModal(null); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
