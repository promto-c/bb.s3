import React from 'react';
import { AlertTriangle, FileIcon, RefreshCw } from 'lucide-react';
import { COMPACT_CSV_VISIBLE_COLUMNS, COMPACT_CSV_VISIBLE_ROWS, COMPACT_TEXT_VISIBLE_LINES } from '@/preview/constants';
import { PreviewActions, PreviewState } from '@/types';

interface Props {
  preview: PreviewState;
  actions?: PreviewActions;
  mode: 'compact' | 'full';
}

const BLOCKED_COPY: Record<NonNullable<PreviewState['blockedReason']>, string> = {
  manual: 'Inline preview is available on demand for this file size.',
  'too-large': 'Inline preview is disabled for files larger than 2 MB.',
  unsupported: 'Inline preview is not available for this file type.',
};

const TextPreview: React.FC<{
  text: string;
  lineCount: number;
  truncated: boolean;
  language: string | null;
  mode: 'compact' | 'full';
}> = ({ text, lineCount, truncated, language, mode }) => {
  const lines = text ? text.split(/\r\n|\r|\n/) : [];
  const visibleLines = mode === 'compact' ? lines.slice(0, COMPACT_TEXT_VISIBLE_LINES) : lines;

  return (
    <div className={`preview-text-shell ${mode}`}>
      <div className="preview-caption">
        <span>{language || 'text'}</span>
        <span>{lineCount} line{lineCount === 1 ? '' : 's'}</span>
        {truncated && <span>truncated</span>}
      </div>
      <div className={`preview-text-frame ${mode}`}>
        {visibleLines.map((line, index) => (
          <div key={`${index}-${line.length}`} className="preview-text-line">
            <span className="preview-line-number">{index + 1}</span>
            <span className="preview-line-text">{line || ' '}</span>
          </div>
        ))}
        {mode === 'compact' && lines.length > COMPACT_TEXT_VISIBLE_LINES && (
          <div className="preview-text-fade" aria-hidden="true"></div>
        )}
      </div>
    </div>
  );
};

const CsvPreview: React.FC<{
  columns: string[];
  rows: string[][];
  truncatedRows: boolean;
  truncatedColumns: boolean;
  rawText: string;
  mode: 'compact' | 'full';
}> = ({ columns, rows, truncatedRows, truncatedColumns, rawText, mode }) => {
  const visibleColumns = mode === 'compact' ? columns.slice(0, COMPACT_CSV_VISIBLE_COLUMNS) : columns;
  const visibleRows = mode === 'compact' ? rows.slice(0, COMPACT_CSV_VISIBLE_ROWS) : rows;
  const compactHiddenColumns = columns.length - visibleColumns.length;
  const compactHiddenRows = rows.length - visibleRows.length;
  const showRawFallback = mode === 'full' && rawText.trim().length > 0;

  return (
    <div className={`preview-table-shell ${mode}`}>
      <div className="preview-caption">
        <span>{columns.length} column{columns.length === 1 ? '' : 's'}</span>
        <span>{rows.length} row{rows.length === 1 ? '' : 's'}</span>
        {(truncatedRows || truncatedColumns) && <span>trimmed</span>}
      </div>
      <div className={`preview-table-wrap ${mode}`}>
        <table className="preview-table">
          <thead>
            <tr>
              {visibleColumns.map((column, index) => (
                <th key={`${column}-${index}`}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.join('|').length}`}>
                  {visibleColumns.map((_, columnIndex) => (
                    <td key={`${rowIndex}-${columnIndex}`}>{row[columnIndex] || ' '}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(visibleColumns.length, 1)} className="preview-table-empty">
                  No CSV rows detected.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {mode === 'compact' && (compactHiddenColumns > 0 || compactHiddenRows > 0) && (
        <div className="preview-footnote">
          Showing {visibleRows.length} row{visibleRows.length === 1 ? '' : 's'} and {visibleColumns.length} column{visibleColumns.length === 1 ? '' : 's'}.
        </div>
      )}
      {showRawFallback && (
        <details className="preview-raw-fallback">
          <summary>Raw text fallback</summary>
          <pre>{rawText}</pre>
        </details>
      )}
    </div>
  );
};

const StatusState: React.FC<{
  title: string;
  message: string | null;
  tone?: 'default' | 'warning';
  action?: React.ReactNode;
}> = ({ title, message, tone = 'default', action }) => (
  <div className={`preview-status ${tone}`}>
    <div className="preview-status-icon">
      {tone === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
    </div>
    <p className="preview-status-title">{title}</p>
    {message && <p className="preview-status-copy">{message}</p>}
    {action}
  </div>
);

const ObjectPreview: React.FC<Props> = ({ preview, actions, mode }) => {
  if (preview.status === 'loading') {
    return (
      <div className="preview-status">
        <div className="preview-status-icon spinning">
          <RefreshCw className="w-5 h-5" />
        </div>
        <p className="preview-status-title">Loading preview...</p>
        <p className="preview-status-copy">Fetching only the bytes needed for this preview.</p>
      </div>
    );
  }

  if (preview.status === 'error') {
    return (
      <StatusState
        title="Preview unavailable"
        message={preview.error || preview.message}
        tone="warning"
      />
    );
  }

  if (preview.status === 'blocked') {
    const blockedMessage = preview.message || (preview.blockedReason ? BLOCKED_COPY[preview.blockedReason] : null);

    return (
      <StatusState
        title={preview.blockedReason === 'manual' ? 'Preview on demand' : 'No inline preview'}
        message={blockedMessage}
        tone={preview.blockedReason === 'unsupported' ? 'default' : 'warning'}
        action={preview.canManualLoad && actions?.loadPreview ? (
          <button type="button" className="btn preview-load-btn" onClick={actions.loadPreview}>
            Load Preview
          </button>
        ) : null}
      />
    );
  }

  if (preview.status === 'ready' && preview.content) {
    if (preview.content.kind === 'media') {
      if (preview.content.mediaType === 'image') {
        return <img src={preview.content.url} alt="Preview" className={`asset-viewer-media ${mode === 'compact' ? 'image compact' : 'image'}`} />;
      }

      return (
        <video
          src={preview.content.url}
          controls
          playsInline
          preload="metadata"
          className={`asset-viewer-media ${mode === 'compact' ? 'video compact' : 'video'}`}
        >
          Your browser does not support video playback.
        </video>
      );
    }

    return (
      <div className="preview-content-shell">
        {preview.message && <div className="preview-banner">{preview.message}</div>}
        {preview.content.kind === 'text' ? (
          <TextPreview
            text={preview.content.text}
            lineCount={preview.content.lineCount}
            truncated={preview.content.truncated}
            language={preview.content.language}
            mode={mode}
          />
        ) : (
          <CsvPreview
            columns={preview.content.columns}
            rows={preview.content.rows}
            truncatedRows={preview.content.truncatedRows}
            truncatedColumns={preview.content.truncatedColumns}
            rawText={preview.content.rawText}
            mode={mode}
          />
        )}
      </div>
    );
  }

  return <StatusState title="No preview available" message="Select a file to load its preview here." />;
};

export default ObjectPreview;
