import { describe, expect, it } from 'vitest';
import { MAX_CSV_COLUMNS } from '@/preview/constants';
import { parseCsvPreview } from '@/preview/csvPreview';

describe('parseCsvPreview', () => {
  it('parses quoted CSV rows with embedded commas and quotes', async () => {
    const rawText = [
      'name,city,note',
      '"Alice","New York","likes ""quoted"" values"',
      '"Bob","Bangkok","comma, inside"',
    ].join('\n');

    const result = await parseCsvPreview(rawText, 'data/report.csv');

    expect(result.content.columns).toEqual(['name', 'city', 'note']);
    expect(result.content.rows[0]).toEqual(['Alice', 'New York', 'likes "quoted" values']);
    expect(result.content.rows[1]).toEqual(['Bob', 'Bangkok', 'comma, inside']);
  });

  it('uses tabs for TSV previews', async () => {
    const rawText = ['name\trole', 'Alice\tAdmin', 'Bob\tViewer'].join('\n');
    const result = await parseCsvPreview(rawText, 'data/roles.tsv');

    expect(result.content.delimiter).toBe('\t');
    expect(result.content.columns).toEqual(['name', 'role']);
    expect(result.content.rows[0]).toEqual(['Alice', 'Admin']);
  });

  it('caps the number of rendered columns', async () => {
    const header = Array.from({ length: MAX_CSV_COLUMNS + 3 }, (_, index) => `col${index + 1}`).join(',');
    const row = Array.from({ length: MAX_CSV_COLUMNS + 3 }, (_, index) => `value${index + 1}`).join(',');
    const result = await parseCsvPreview([header, row].join('\n'), 'data/wide.csv');

    expect(result.content.columns).toHaveLength(MAX_CSV_COLUMNS);
    expect(result.content.truncatedColumns).toBe(true);
  });
});
