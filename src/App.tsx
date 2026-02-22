import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { S3Config, Bucket, S3Object } from '@/types';
import { S3Service } from '@/services/s3Service';
import ConnectionForm from '@/components/ConnectionForm';
import BucketList from '@/components/BucketList';
import FileManager from '@/components/FileManager';
import FileDetails from '@/components/FileDetails';

const App: React.FC = () => {
  const [s3Config, setS3Config] = useState<S3Config | null>(null);
  const [s3Service, setS3Service] = useState<S3Service | null>(null);
  
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  
  const [currentObjects, setCurrentObjects] = useState<S3Object[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [selectedObject, setSelectedObject] = useState<S3Object | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Background animation state
  const [topoLines, setTopoLines] = useState<number[]>([]);

  useEffect(() => {
    // Generate random lines for background
    setTopoLines(Array.from({ length: 15 }, (_, i) => i));
  }, []);

  const showNotification = (msg: string, type: 'success'|'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleConnect = (config: S3Config) => {
    setIsLoading(true);
    const service = new S3Service(config);
    
    service.listBuckets()
      .then(buckets => {
        setS3Service(service);
        setS3Config(config);
        setBuckets(buckets);
        setIsSidebarOpen(true);
        showNotification("Connected successfully!", "success");
      })
      .catch(err => {
        console.error(err);
        showNotification("Connection failed. Check credentials.", "error");
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
    setIsSidebarOpen(false);
    setIsLoading(false);
    showNotification("Disconnected", "success");
  };

  const loadObjects = useCallback(async (bucket: string, prefix: string) => {
    if (!s3Service) return;
    setIsLoading(true);
    try {
      const objs = await s3Service.listObjects(bucket, prefix);
      setCurrentObjects(objs);
      setCurrentPrefix(prefix);
    } catch (err) {
      console.error(err);
      showNotification("Failed to list objects", "error");
    } finally {
      setIsLoading(false);
    }
  }, [s3Service]);

  useEffect(() => {
    if (selectedBucket) {
      loadObjects(selectedBucket, '');
      setSelectedObject(null);
    }
  }, [selectedBucket, loadObjects]);

  const handleBucketSelect = (bucket: string) => {
    setSelectedBucket(bucket);
    closeSidebar();
  };

  const handleCreateBucket = async (nameInput: string): Promise<boolean> => {
    if (!s3Service) return false;

    const name = nameInput.trim();
    if (!name) {
      showNotification("Bucket name cannot be empty", "error");
      return false;
    }

    // S3 bucket naming basics: lowercase letters, numbers, dots and hyphens.
    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(name)) {
      showNotification("Invalid bucket name format", "error");
      return false;
    }

    try {
      await s3Service.createBucket(name);
      const b = await s3Service.listBuckets();
      setBuckets(b);
      setSelectedBucket(name);
      showNotification("Bucket created", "success");
      return true;
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Unknown error";
      showNotification(`Failed to create bucket: ${message}`, "error");
      return false;
    }
  };

  const handleDeleteBucket = async (name: string) => {
      if(!confirm(`Are you sure you want to delete ${name}?`)) return;
      if (s3Service) {
          try {
              await s3Service.deleteBucket(name);
              const b = await s3Service.listBuckets();
              setBuckets(b);
              if (selectedBucket === name) {
                setSelectedBucket(null);
                setCurrentObjects([]);
                setCurrentPrefix('');
                setSelectedObject(null);
              }
              showNotification("Bucket deleted", "success");
          } catch (e) {
              console.error(e);
              const message = e instanceof Error ? e.message : "Unknown error";
              showNotification(`Failed to delete bucket: ${message}`, "error");
          }
      }
  };

  const handleUpload = async (file: File) => {
      if (!s3Service || !selectedBucket) return;
      
      showNotification("Uploading...", "success");
      
      try {
          await s3Service.uploadFile(selectedBucket, currentPrefix + file.name, file);
          await loadObjects(selectedBucket, currentPrefix);
          showNotification("File uploaded successfully", "success");
      } catch (e) {
          showNotification("Upload failed", "error");
      }
  };

  const handleCreateFolder = async (pathInput: string) => {
      if (!s3Service || !selectedBucket) return;

      const normalizedInput = pathInput
          .trim()
          .replace(/\\/g, '/')
          .replace(/\/{2,}/g, '/');

      if (!normalizedInput || normalizedInput === '/') {
          showNotification("Folder name cannot be empty", "error");
          return;
      }

      const isAbsolutePath = normalizedInput.startsWith('/');
      const cleanedPath = normalizedInput
          .replace(/^\/+/, '')
          .replace(/\/+$/, '');

      if (!cleanedPath) {
          showNotification("Folder name cannot be empty", "error");
          return;
      }

      const folderKey = `${isAbsolutePath ? '' : currentPrefix}${cleanedPath}/`;

      try {
          await s3Service.createFolder(selectedBucket, folderKey);
          await loadObjects(selectedBucket, currentPrefix);
          showNotification("Folder created", "success");
      } catch (e) {
          console.error(e);
          const message = e instanceof Error ? e.message : "Unknown error";
          showNotification(`Failed to create folder: ${message}`, "error");
      }
  };

  const handleDeleteObject = async (key: string) => {
      if (!s3Service || !selectedBucket) return;
      if(!confirm("Delete this file?")) return;

      try {
          await s3Service.deleteObject(selectedBucket, key);
          await loadObjects(selectedBucket, currentPrefix);
          if (selectedObject?.key === key) setSelectedObject(null);
          showNotification("File deleted", "success");
      } catch (e) {
          showNotification("Delete failed", "error");
      }
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
                <div className={`notification-toast fixed top-6 right-6 p-4 rounded-lg shadow-2xl z-50 text-white font-medium tracking-wide animate-fade-in-down border ${notification.type === 'error' ? 'bg-red-900/50 border-red-800 text-red-100' : 'bg-green-900/50 border-green-800 text-green-100'} backdrop-blur-md`}>
                    {notification.msg}
                </div>
            )}
            <ConnectionForm onConnect={handleConnect} />
        </div>
    );
  }

  const inspectorOpen = Boolean(selectedObject && !selectedObject.isFolder);

  return (
    <div 
      className="app-shell"
      data-sidebar-open={isSidebarOpen ? 'true' : 'false'}
      data-inspector-open={inspectorOpen ? 'true' : 'false'}
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
      
      {/* Notifications */}
      {notification && (
        <div className={`notification-toast fixed top-6 right-6 px-6 py-3 rounded-lg shadow-2xl z-[100] font-medium flex items-center gap-3 backdrop-blur-xl border ${notification.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-100' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100'}`}>
            <div className={`w-2 h-2 rounded-full ${notification.type === 'error' ? 'bg-red-500 box-shadow-red' : 'bg-emerald-400 box-shadow-emerald'}`}></div>
            {notification.msg}
        </div>
      )}

      {/* Sidebar */}
      <BucketList 
        buckets={buckets} 
        selectedBucket={selectedBucket} 
        onSelect={handleBucketSelect}
        onCreate={handleCreateBucket}
        onDelete={handleDeleteBucket}
        onClose={closeSidebar}
        onDisconnect={handleDisconnect}
      />

      {/* Main Content */}
      <main>
        {selectedBucket ? (
            <FileManager 
                bucketName={selectedBucket}
                objects={currentObjects}
                currentPrefix={currentPrefix}
                onNavigate={(prefix) => loadObjects(selectedBucket, prefix)}
                onUpload={handleUpload}
                onCreateFolder={handleCreateFolder}
                onDelete={handleDeleteObject}
                onSelect={setSelectedObject}
                selectedObject={selectedObject}
                onToggleSidebar={toggleSidebar}
            />
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

      {/* Inspector Panel */}
      <div className={`inspector transition-all duration-300 ease-in-out ${inspectorOpen ? 'open' : ''}`}>
        {selectedObject && !selectedObject.isFolder && selectedBucket && s3Service && (
            <FileDetails 
                object={selectedObject} 
                bucketName={selectedBucket}
                onClose={() => setSelectedObject(null)}
                s3Service={s3Service}
                onDelete={handleDeleteObject}
            />
        )}
      </div>

      <button
        type="button"
        className="inspector-scrim"
        aria-label="Close file details"
        onClick={() => setSelectedObject(null)}
      />
    </div>
  );
};

export default App;
