import React from 'react';

interface PageHeaderProps {
  /** Content that appears on the left side of the header (typically nav controls + title/breadcrumbs). */
  children?: React.ReactNode;
  /** Optional right-hand area for action buttons, view toggles, etc. */
  right?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ children, right, className = '' }) => {
  return (
    <header
      className={`flex items-center justify-between px-4 py-2 border-b border-[#1f1f1f] bg-[#0a0a0a]/50 backdrop-blur-md shrink-0 z-20 ${className}`}
    >
      <div className="header-left flex items-center gap-4 flex-1 min-w-0">
        {children}
      </div>
      {right && <div className="action-bar">{right}</div>}
    </header>
  );
};

export default PageHeader;
