import React from 'react';
import { Bucket } from '@/types';
import { Plus, Trash2, Search, Database, X, LogOut } from 'lucide-react';

interface Props {
  buckets: Bucket[];
  selectedBucket: string | null;
  onSelect: (bucketName: string) => void;
  onCreate: (bucketName: string) => boolean | Promise<boolean>;
  onDelete: (bucketName: string) => void;
  onClose?: () => void;
  onDisconnect?: () => void;
}

const BucketList: React.FC<Props> = ({ buckets, selectedBucket, onSelect, onCreate, onDelete, onClose, onDisconnect }) => {
  const [filter, setFilter] = React.useState('');
  const [isCreateBucketOpen, setIsCreateBucketOpen] = React.useState(false);
  const [newBucketName, setNewBucketName] = React.useState('');
  const [isCreatingBucket, setIsCreatingBucket] = React.useState(false);

  const filteredBuckets = buckets.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()));

  const openCreateBucketDialog = () => {
    setNewBucketName('');
    setIsCreateBucketOpen(true);
  };

  const handleCreateBucketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim() || isCreatingBucket) return;

    setIsCreatingBucket(true);
    try {
      const created = await onCreate(newBucketName.trim());
      if (created) {
        setIsCreateBucketOpen(false);
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

        {/* Navigation */}
        <nav className="flex-1 flex flex-col min-h-0">
            <div className="mb-4 flex-1 min-h-0 flex flex-col">
                <div className="relative group w-full mb-3">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#444] group-focus-within:text-[#777] transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="onyx-input"
                        style={{ paddingLeft: '2rem', fontSize: '0.75rem' }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center justify-between px-2 mb-2">
                    <div className="section-label" style={{ margin: 0 }}>
                        Storage Buckets
                        <span className="ml-1.5 text-[#333] font-mono">{filteredBuckets.length}{filter && filteredBuckets.length !== buckets.length ? `/${buckets.length}` : ''}</span>
                    </div>
                    <button 
                        onClick={openCreateBucketDialog}
                        className="text-[#555] hover:text-white transition-colors p-1"
                        title="Create Bucket"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
                
                <ul className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
                    {filteredBuckets.length === 0 && (
                        <li className="text-[#444] text-xs px-2 py-2 italic font-mono">No buckets found</li>
                    )}
                    
                    {filteredBuckets.map(bucket => (
                        <li 
                            key={bucket.name}
                            onClick={() => { onSelect(bucket.name); onClose?.(); }}
                            className={`${selectedBucket === bucket.name ? 'active' : ''} group`}
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

            <div className="pt-0 border-t border-[#111]">
                {onDisconnect && (
                    <button
                        type="button"
                        onClick={onDisconnect}
                        className="btn w-full mt-4 justify-center"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Disconnect
                    </button>
                )}
            </div>
        </nav>

        {isCreateBucketOpen && (
            <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <form
                    onSubmit={handleCreateBucketSubmit}
                    className="w-full max-w-md bg-[#0a0a0a] border border-[#222] rounded-xl p-4 shadow-2xl space-y-3"
                >
                    <div className="text-sm font-semibold text-white">Create Bucket</div>
                    <div className="text-xs text-[#777]">
                        Use a lowercase bucket name (letters, numbers, dots, hyphens).
                    </div>
                    <input
                        autoFocus
                        type="text"
                        className="onyx-input"
                        placeholder="my-bucket-name"
                        value={newBucketName}
                        onChange={(e) => setNewBucketName(e.target.value)}
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              if (isCreatingBucket) return;
                              setIsCreateBucketOpen(false);
                              setNewBucketName('');
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={!newBucketName.trim() || isCreatingBucket}
                        >
                            <Plus className="w-3.5 h-3.5" /> {isCreatingBucket ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        )}
    </aside>
  );
};

export default BucketList;
