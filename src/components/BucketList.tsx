import React from 'react';
import { Bucket } from '@/types';
import { Plus, Trash2, Database, X, Power, Github, Check } from 'lucide-react';
import { ExpandableSearch } from '@/components';

interface Props {
  buckets: Bucket[];
  selectedBucket: string | null;
  onSelect: (bucketName: string) => void;
  onCreate: (bucketName: string) => boolean | Promise<boolean>;
  onDelete: (bucketName: string) => void;
  onClose?: () => void;
  onDisconnect?: () => void;
  endpoint?: string;
  /** name of a bucket that is currently being created (optimistic placeholder) */
  pendingBucket?: string;
}

export const BucketList: React.FC<Props> = ({ buckets, selectedBucket, onSelect, onCreate, onDelete, onClose, onDisconnect, endpoint, pendingBucket }) => {
  const [filter, setFilter] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [showCreateInput, setShowCreateInput] = React.useState(false);
  const [newBucketName, setNewBucketName] = React.useState('');
  const [isCreatingBucket, setIsCreatingBucket] = React.useState(false);
  const createInputRef = React.useRef<HTMLInputElement>(null);

  const filteredBuckets = buckets.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()));

  // keep a ref to previous names so we can detect inserts for animation
  const prevBucketsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    const prev = prevBucketsRef.current;
    const currentNames = buckets.map(b => b.name);

    // if a pending bucket has just materialized in the list, scroll/highlight
    if (pendingBucket && !prev.includes(pendingBucket) && currentNames.includes(pendingBucket)) {
      // wait for the DOM to update
      requestAnimationFrame(() => {
        const el = document.getElementById(`bucket-item-${pendingBucket}`);
        if (el) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          // flash a green background then fade out
          el.classList.add('bg-green-500/20', 'transition-colors', 'duration-700');
          setTimeout(() => {
            el.classList.remove('bg-green-500/20');
          }, 800);
        }
      });
    }

    prevBucketsRef.current = currentNames;
  }, [buckets, pendingBucket]);

  React.useEffect(() => {
    if (showCreateInput) {
      setTimeout(() => createInputRef.current?.focus(), 10);
    }
  }, [showCreateInput]);

  const openCreateBucketDialog = () => {
    if (showCreateInput) return;
    setNewBucketName('');
    setShowCreateInput(true);
  };

  const cancelCreate = () => {
    if (isCreatingBucket) return;
    setShowCreateInput(false);
    setNewBucketName('');
  };

  const handleCreateBucketSubmit = async () => {
    if (!newBucketName.trim() || isCreatingBucket) return;

    setIsCreatingBucket(true);
    try {
      const created = await onCreate(newBucketName.trim());
      if (created) {
        setShowCreateInput(false);
        setNewBucketName('');
      }
    } finally {
      setIsCreatingBucket(false);
    }
  };

  return (
    <aside className="sidebar">
        {/* Logo */}
        <div className="logo">
            <div className="logo-mark"></div>
            <span>BB.S3</span>
            <span className="badge text-[#888]">v{__APP_VERSION__}</span>
            <a
                href="https://github.com/promto-c/bb.s3"
                target="_blank"
                rel="noopener noreferrer"
                className="badge inline-flex items-center justify-center aspect-square p-1 text-[#888] hover:text-white transition-colors"
                aria-label="GitHub repository"
            >
                <Github className="w-3 h-3" />
            </a>
            {onClose && (
                <button
                    type="button"
                    className="sidebar-close mobile-only"
                    onClick={onClose}
                    aria-label="Close sidebar"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>

        {/* Connection chip */}
        {endpoint && onDisconnect && (
            <div className="connection-chip group/conn">
                <span className="connection-chip-dot" />
                <span className="connection-chip-label">{endpoint.replace(/^https?:\/\//, '')}</span>
                <button
                    type="button"
                    onClick={onDisconnect}
                    className="connection-chip-disconnect"
                    aria-label="Disconnect"
                    title="Disconnect"
                >
                    <Power className="w-3 h-3" />
                </button>
            </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 flex flex-col min-h-0">
            <div className="mb-4 flex-1 min-h-0 flex flex-col">
                <div className="relative flex items-center justify-between px-2 mb-2">
                    <div className={`section-label expandable-search-label ${isSearchOpen || showCreateInput ? 'collapsed' : ''}`} style={{ margin: 0 }}>
                        Buckets
                        <span className="ml-1.5 text-[#333] font-mono">{filteredBuckets.length}{filter && filteredBuckets.length !== buckets.length ? `/${buckets.length}` : ''}</span>
                    </div>

                    {/* Expandable create input — mirrors ExpandableSearch pattern */}
                    <div className={`expandable-create ${showCreateInput ? 'open' : ''}`}>
                        <Plus className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
                        <input
                            ref={createInputRef}
                            type="text"
                            placeholder="new-bucket-name"
                            className="expandable-create-input"
                            value={newBucketName}
                            onChange={(e) => setNewBucketName(e.target.value)}
                            onBlur={() => { if (!newBucketName.trim()) cancelCreate(); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleCreateBucketSubmit(); }
                                if (e.key === 'Escape') { cancelCreate(); createInputRef.current?.blur(); }
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-0.5">
                        {!showCreateInput && (
                            <ExpandableSearch value={filter} onChange={setFilter} placeholder="Search..." title="Search Buckets" onOpenChange={setIsSearchOpen} />
                        )}
                        {showCreateInput ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleCreateBucketSubmit}
                                    className={`p-1 transition-colors ${newBucketName.trim() && !isCreatingBucket ? 'text-emerald-400 hover:text-emerald-300' : 'text-[#333] pointer-events-none'}`}
                                    title="Create bucket"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelCreate}
                                    className="text-[#555] hover:text-white transition-colors p-1"
                                    title="Cancel"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={openCreateBucketDialog}
                                className={`text-[#555] hover:text-white transition-colors p-1 ${isSearchOpen ? 'opacity-30 pointer-events-none' : ''}`}
                                title="Create Bucket"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <ul className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
                    {filteredBuckets.length === 0 && !pendingBucket && (
                        <li className="text-[#444] text-xs px-2 py-2 italic font-mono">No buckets found</li>
                    )}

                {/* placeholder entry while a new bucket is being created */}
                {pendingBucket &&
                  !buckets.some(b => b.name === pendingBucket) &&
                  pendingBucket.toLowerCase().includes(filter.toLowerCase()) && (
                    <li
                        key="__creating"
                        className="opacity-60 pointer-events-none flex items-center gap-1 animate-pulse"
                    >
                        <Database className="w-3.5 h-3.5 text-[#444]" />
                        <span className="truncate flex-1">{pendingBucket}...</span>
                    </li>
                )}

                    {filteredBuckets.map(bucket => (
                        <li 
                            key={bucket.name}
                            id={`bucket-item-${bucket.name}`}
                            onClick={() => { onSelect(bucket.name); onClose?.(); }}
                            className={`${selectedBucket === bucket.name ? 'active' : ''} group transition-colors duration-500`}
                        >
                            <Database className={`w-3.5 h-3.5 ${selectedBucket === bucket.name ? 'text-white' : 'text-[#444]'}`} />
                            <span className="truncate flex-1">{bucket.name}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(bucket.name); }}
                                className="text-[#444] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"                                title={`Delete ${bucket.name}`}
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>

    </aside>
  );
};
