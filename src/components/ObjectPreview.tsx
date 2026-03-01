import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, FileIcon, RefreshCw } from 'lucide-react';
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

const HtmlPreview: React.FC<{
  html?: string;
  text?: string;
  lineCount?: number;
  truncated?: boolean;
  url?: string | null;
  mode: 'compact' | 'full';
}> = ({ html, text, lineCount, truncated, url, mode }) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'source'>('rendered');
  const [allowScripts, setAllowScripts] = useState(false);
  const [useFullPage, setUseFullPage] = useState(!html);

  const sandboxValue = allowScripts ? 'allow-scripts' : '';

  if (mode === 'compact') {
    return (
      <div className="preview-html-shell compact">
        <iframe
          sandbox=""
          {...(useFullPage && url ? { src: url } : { srcDoc: html })}
          title="HTML preview"
          className="preview-html-iframe compact"
        />
      </div>
    );
  }

  const showFullPageOption = url && (truncated || useFullPage);
  const hasSource = text && typeof lineCount === 'number';

  return (
    <div className="preview-html-shell full">
      <div className="preview-html-toolbar">
        <div className="preview-html-view-toggle">
          <button
            type="button"
            className={`preview-html-toggle-btn${viewMode === 'rendered' ? ' active' : ''}`}
            onClick={() => setViewMode('rendered')}
          >
            Rendered
          </button>
          {hasSource && (
            <button
              type="button"
              className={`preview-html-toggle-btn${viewMode === 'source' ? ' active' : ''}`}
              onClick={() => setViewMode('source')}
            >
              Source
            </button>
          )}
        </div>

        <div className="preview-html-toolbar-actions">
          {viewMode === 'rendered' && truncated && url && !useFullPage && (
            <button
              type="button"
              className="preview-html-fullpage-btn"
              onClick={() => setUseFullPage(true)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Full Page</span>
            </button>
          )}

          {viewMode === 'rendered' && useFullPage && html && (
            <button
              type="button"
              className="preview-html-fullpage-btn"
              onClick={() => setUseFullPage(false)}
            >
              <span>Back to Preview</span>
            </button>
          )}

          {viewMode === 'rendered' && (
            <label className="preview-html-scripts-toggle">
              <input
                type="checkbox"
                checked={allowScripts}
                onChange={(e) => setAllowScripts(e.target.checked)}
              />
              <span>Allow scripts</span>
            </label>
          )}
        </div>
      </div>

      {viewMode === 'rendered' ? (
        <iframe
          key={`iframe-${useFullPage}-${allowScripts}`}
          sandbox={sandboxValue}
          {...(useFullPage && url ? { src: url } : { srcDoc: html })}
          title="HTML preview"
          className="preview-html-iframe full"
        />
      ) : hasSource ? (
        <TextPreview
          text={text}
          lineCount={lineCount}
          truncated={truncated ?? false}
          language="html"
          mode="full"
        />
      ) : null}
    </div>
  );
};

const SplatPreview: React.FC<{
  url: string;
  mode: 'compact' | 'full';
}> = ({ url, mode }) => {
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSrcDoc(null);

    import('@/preview/splatPreview')
      .then(({ buildSplatViewerHtml }) => buildSplatViewerHtml(url))
      .then((html) => {
        if (!cancelled) {
          setSrcDoc(html);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load viewer');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <div className="preview-status">
        <div className="preview-status-icon spinning">
          <RefreshCw className="w-5 h-5" />
        </div>
        <p className="preview-status-title">Loading 3D viewer...</p>
        <p className="preview-status-copy">Preparing the Gaussian Splat renderer.</p>
      </div>
    );
  }

  if (error) {
    return (
      <StatusState
        title="Viewer unavailable"
        message={error}
        tone="warning"
      />
    );
  }

  return (
    <iframe
      srcDoc={srcDoc ?? undefined}
      sandbox="allow-scripts allow-same-origin"
      title="Gaussian Splat preview"
      className={`preview-splat-iframe ${mode}`}
    />
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
  const [htmlDirectPreview, setHtmlDirectPreview] = useState(false);

  const currentKey = `${preview.handlerId}:${preview.status}:${preview.downloadUrl}`;
  const [prevKey, setPrevKey] = useState(currentKey);
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setHtmlDirectPreview(false);
  }

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
    if (htmlDirectPreview && preview.handlerId === 'html' && preview.downloadUrl) {
      return (
        <div className="preview-content-shell">
          <HtmlPreview url={preview.downloadUrl} mode={mode} />
        </div>
      );
    }

    const blockedMessage = preview.message || (preview.blockedReason ? BLOCKED_COPY[preview.blockedReason] : null);
    const isHtml = preview.handlerId === 'html' && preview.downloadUrl;

    return (
      <StatusState
        title={preview.blockedReason === 'manual' ? 'Preview on demand' : 'No inline preview'}
        message={blockedMessage}
        tone={preview.blockedReason === 'unsupported' ? 'default' : 'warning'}
        action={
          <div className="preview-blocked-actions">
            {preview.canManualLoad && actions?.loadPreview && (
              <button type="button" className="btn preview-load-btn" onClick={actions.loadPreview}>
                Load Preview
              </button>
            )}
            {isHtml && (
              <button type="button" className="btn preview-load-btn" onClick={() => setHtmlDirectPreview(true)}>
                Preview HTML
              </button>
            )}
          </div>
        }
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

    if (preview.content.kind === 'splat') {
      return <SplatPreview url={preview.content.url} mode={mode} />;
    }

    if (preview.content.kind === 'html') {
      return (
        <div className="preview-content-shell">
          {preview.message && <div className="preview-banner">{preview.message}</div>}
          <HtmlPreview
            html={preview.content.html}
            text={preview.content.text}
            lineCount={preview.content.lineCount}
            truncated={preview.content.truncated}
            url={preview.downloadUrl}
            mode={mode}
          />
        </div>
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
