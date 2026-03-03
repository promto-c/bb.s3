import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FolderOpen, Trash2 } from 'lucide-react';
import { S3Object } from '@/types';

interface ContextMenuProps {
  position: { x: number; y: number };
  object: S3Object;
  onOpen: (obj: S3Object) => void;
  onDownload: (key: string) => void;
  onDelete: (key: string) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  object,
  onOpen,
  onDownload,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjusted, setAdjusted] = useState(position);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    let x = position.x;
    let y = position.y;
    if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
    setAdjusted({ x, y });
  }, [position]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <>
      <div className="context-menu-backdrop" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        ref={menuRef}
        className="context-menu"
        style={{ top: adjusted.y, left: adjusted.x }}
        role="menu"
      >
        <button
          className="context-menu-item"
          role="menuitem"
          onClick={() => { onOpen(object); onClose(); }}
        >
          <FolderOpen className="w-4 h-4" />
          Open
        </button>
        {!object.isFolder && (
          <button
            className="context-menu-item"
            role="menuitem"
            onClick={() => { onDownload(object.key); onClose(); }}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
        <div className="context-menu-separator" />
        <button
          className="context-menu-item context-menu-item-danger"
          role="menuitem"
          onClick={() => { onDelete(object.key); onClose(); }}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </>,
    document.body
  );
};
