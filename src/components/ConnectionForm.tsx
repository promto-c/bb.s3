import React, { useState, useEffect } from 'react';
import { S3Config, SavedConnection } from '@/types';
import { Server, Key, Shield, Globe, Star, Trash2, Clock, Loader2 } from 'lucide-react';

interface Props {
  onConnect: (config: S3Config) => void;
  isConnecting?: boolean;
}

const ConnectionForm: React.FC<Props> = ({ onConnect, isConnecting }) => {
  const [config, setConfig] = useState<S3Config>({
    endpoint: 'https://play.min.io',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1'
  });

  const [rememberSession, setRememberSession] = useState(false);
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('bb_s3_connections');
    const savedSessions = sessionStorage.getItem('bb_s3_sessions');
    
    if (saved) {
      try {
        const parsedConnections = JSON.parse(saved);
        let sessionsMap: Record<string, SavedConnection> = {};
        
        if (savedSessions) {
          try {
            sessionsMap = JSON.parse(savedSessions);
          } catch (e) {
            console.error('Failed to parse saved sessions', e);
          }
        }
        
        const connectionsWithSessions = parsedConnections.map((conn: SavedConnection) => {
          if (sessionsMap[conn.id]) {
            return sessionsMap[conn.id];
          }
          return conn;
        });
        
        setSavedConnections(connectionsWithSessions);
      } catch (e) {
        console.error('Failed to parse saved connections', e);
      }
    }
  }, []);

  const persistConnections = (connections: SavedConnection[]) => {
    // Save to localStorage without secrets
    const connectionsForStorage = connections.map(conn => {
      const { secretAccessKey, ...rest } = conn;
      return rest;
    });
    localStorage.setItem('bb_s3_connections', JSON.stringify(connectionsForStorage));
    
    // Save sessions to sessionStorage
    const sessionsMap: Record<string, SavedConnection> = {};
    connections.forEach(conn => {
      if (conn.secretAccessKey) {
        sessionsMap[conn.id] = conn;
      }
    });
    sessionStorage.setItem('bb_s3_sessions', JSON.stringify(sessionsMap));
  };

  const saveConnection = (currentConfig: S3Config, shouldRemember: boolean = rememberSession) => {
    const newConnections = [...savedConnections];
    const existingIndex = newConnections.findIndex(c => 
      c.endpoint === currentConfig.endpoint && 
      c.accessKeyId === currentConfig.accessKeyId && 
      c.region === currentConfig.region
    );

    const connectionId = existingIndex >= 0 ? newConnections[existingIndex].id : Math.random().toString(36).substring(2, 15);

    const connectionData: SavedConnection = {
      ...currentConfig,
      id: connectionId,
      lastUsed: Date.now(),
      pinned: existingIndex >= 0 ? newConnections[existingIndex].pinned : false
    };

    if (!shouldRemember) {
      delete connectionData.secretAccessKey;
    }

    if (existingIndex >= 0) {
      newConnections[existingIndex] = connectionData;
    } else {
      newConnections.push(connectionData);
    }

    // Sort: pinned first, then by lastUsed
    newConnections.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.lastUsed - a.lastUsed;
    });

    setSavedConnections(newConnections);
    persistConnections(newConnections);
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newConnections = savedConnections.map(c => 
      c.id === id ? { ...c, pinned: !c.pinned } : c
    );
    newConnections.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.lastUsed - a.lastUsed;
    });
    setSavedConnections(newConnections);
    persistConnections(newConnections);
  };

  const deleteConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newConnections = savedConnections.filter(c => c.id !== id);
    setSavedConnections(newConnections);
    persistConnections(newConnections);
  };

  const clearConnections = () => {
    if (confirm('Are you sure you want to clear all unpinned connections?')) {
      const newConnections = savedConnections.filter(c => c.pinned);
      setSavedConnections(newConnections);
      persistConnections(newConnections);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConnection(config);
    onConnect(config);
  };


  return (
    <div className="overflow-y-auto flex flex-col items-center justify-center h-full w-full p-3 relative z-10">
      <div className="w-full max-w-[360px] bg-[#0a0a0a] border border-[#222] rounded-xl p-6 shadow-2xl flex flex-col gap-4 backdrop-blur-sm">

        {/* Header */}
        <div className="logo mb-3 justify-center">
            <div className="logo-mark"></div>
            BB.S3
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="data-row mb-0">
            <label className="data-label flex items-center gap-2">
              <Globe className="w-3 h-3" /> Endpoint
            </label>
            <input
              type="text"
              placeholder="https://s3.amazonaws.com"
              className="onyx-input"
              value={config.endpoint}
              onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              required
            />
          </div>

          <div className="data-row mb-0">
            <label className="data-label flex items-center gap-2">
              <Key className="w-3 h-3" /> Access Key
            </label>
            <input
              type="text"
              className="onyx-input"
              value={config.accessKeyId}
              onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
            />
          </div>

          <div className="data-row mb-0">
            <label className="data-label flex items-center gap-2">
              <Shield className="w-3 h-3" /> Secret Key
            </label>
            <input
              type="password"
              className="onyx-input"
              value={config.secretAccessKey}
              onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
            />
          </div>

          <div className="data-row mb-0">
            <label className="data-label flex items-center gap-2">
              <Globe className="w-3 h-3" /> Region
            </label>
            <input
              type="text"
              className="onyx-input"
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 mt-3 mb-1">
            <input
              type="checkbox"
              id="rememberSession"
              checked={rememberSession}
              onChange={(e) => setRememberSession(e.target.checked)}
              className="onyx-checkbox"
            />
            <label htmlFor="rememberSession" className="data-label !mb-0 cursor-pointer select-none flex items-center">
              Remember Session
            </label>
          </div>

          <button
            type="submit"
            disabled={isConnecting}
            className="btn !mt-6 w-full bg-[#ddd] text-black font-bold hover:bg-[#eee] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:text-black justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
            ) : (
              <><Server className="w-4 h-4" /> Connect</>
            )}
          </button>
        </form>

      </div>

      {savedConnections.length > 0 && (
        <div className="w-full max-w-[360px] mt-4 bg-[#0a0a0a] border border-[#222] rounded-xl p-4 shadow-2xl flex flex-col gap-2 backdrop-blur-sm max-h-[300px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Connections
            </h3>
            <button 
              onClick={clearConnections}
              className="text-xs text-white/40 hover:text-white/80 transition-colors"
            >
              Clear Unpinned
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {savedConnections.map(conn => (
              <div 
                key={conn.id}
                onClick={() => {
                  const newConfig = {
                    endpoint: conn.endpoint,
                    accessKeyId: conn.accessKeyId,
                    secretAccessKey: conn.secretAccessKey || '',
                    region: conn.region
                  };
                  const shouldRemember = !!conn.secretAccessKey;
                  setConfig(newConfig);
                  setRememberSession(shouldRemember);
                  
                  if (shouldRemember) {
                    saveConnection(newConfig, shouldRemember);
                    onConnect(newConfig);
                  }
                }}
                className="group flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
              >
                <div className="flex flex-col overflow-hidden flex-1 mr-2">
                  <span className="text-sm font-medium text-white truncate">{conn.endpoint}</span>
                  <span className="text-xs text-white/50 truncate">{conn.accessKeyId || 'Anonymous'} • {conn.region}</span>
                </div>
                <div className={`flex items-center gap-1 transition-opacity ${conn.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button 
                    onClick={(e) => togglePin(conn.id, e)}
                    className={`p-1.5 rounded hover:bg-white/10 transition-colors ${conn.pinned ? 'text-yellow-400' : 'text-white/40 hover:text-white'}`}
                    title={conn.pinned ? "Unpin" : "Pin"}
                  >
                    <Star className="w-3.5 h-3.5" fill={conn.pinned ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={(e) => deleteConnection(conn.id, e)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionForm;
