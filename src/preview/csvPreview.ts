import type { ParseError, ParseResult } from 'papaparse';
import { MAX_CSV_COLUMNS, MAX_CSV_ROWS } from '@/preview/constants';
import { getObjectExtension } from '@/preview/registry';
import { PreviewTableContent } from '@/types';

export interface CsvPreviewResult {
  content: PreviewTableContent;
  isTruncated: boolean;
  message: string | null;
}

const normalizeRow = (row: unknown): string[] => {
  if (Array.isArray(row)) {
    return row.map((value) => `${value ?? ''}`);
  }

  if (row && typeof row === 'object') {
    return Object.values(row).map((value) => `${value ?? ''}`);
  }

  return [`${row ?? ''}`];
};

const getCsvMessage = (errors: ParseError[], truncatedRows: boolean, truncatedColumns: boolean): string | null => {
  if (errors.length > 0) {
    return `${errors[0].message} Raw text is available below.`;
  }

  if (truncatedRows && truncatedColumns) {
    return 'Preview limited to the first rows and columns for performance.';
  }

  if (truncatedRows) {
    return 'Preview limited to the first rows for performance.';
  }

  if (truncatedColumns) {
    return 'Preview limited to the first columns for readability.';
  }

  return null;
};

export const parseCsvPreview = async (rawText: string, key: string): Promise<CsvPreviewResult> => {
  const Papa = await import('papaparse');
  const extension = getObjectExtension(key);
  const forcedDelimiter = extension === 'tsv' ? '\t' : undefined;

  const parsed: ParseResult<string[]> = Papa.parse<string[]>(rawText, {
    delimiter: forcedDelimiter,
    preview: MAX_CSV_ROWS,
    skipEmptyLines: 'greedy',
    worker: false,
  });

  const normalizedRows = parsed.data.map(normalizeRow);
  const totalColumns = normalizedRows.reduce((max, row) => Math.max(max, row.length), 0);
  const truncatedRows = normalizedRows.length === MAX_CSV_ROWS;
  const truncatedColumns = totalColumns > MAX_CSV_COLUMNS;
  const visibleColumns = Math.min(totalColumns, MAX_CSV_COLUMNS);

  const headerSource = normalizedRows[0] ?? [];
  const columns = Array.from({ length: visibleColumns }, (_, index) => {
    const label = headerSource[index]?.trim();
    return label || `Column ${index + 1}`;
  });
  const rows = normalizedRows.slice(1).map((row) => {
    return Array.from({ length: visibleColumns }, (_, index) => row[index] ?? '');
  });
  const delimiter = forcedDelimiter === '\t' || parsed.meta.delimiter === '\t' ? '\t' : ',';

  return {
    content: {
      kind: 'table',
      columns,
      rows,
      truncatedRows,
      truncatedColumns,
      rawText,
      delimiter,
    },
    isTruncated: truncatedRows || truncatedColumns,
    message: getCsvMessage(parsed.errors, truncatedRows, truncatedColumns),
  };
};
