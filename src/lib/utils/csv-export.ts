/**
 * CSV Export Utility
 *
 * Provides functions to convert data to CSV format and trigger downloads.
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) {
    return '';
  }

  // If columns not specified, use all keys from first object
  const cols = columns || Object.keys(data[0]).map(key => ({
    key: key as keyof T,
    label: key
  }));

  // Create header row
  const headers = cols.map(col => escapeCSVValue(col.label));
  const headerRow = headers.join(',');

  // Create data rows
  const dataRows = data.map(row => {
    const values = cols.map(col => {
      const value = row[col.key];
      return escapeCSVValue(formatValue(value));
    });
    return values.join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
  // Convert to string
  const str = String(value ?? '');

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Format value for CSV export
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.join('; ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csv: string, filename: string): void {
  // Create blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  const csv = arrayToCSV(data, columns);

  // Add .csv extension if not present
  const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  downloadCSV(csv, csvFilename);
}

/**
 * Generate filename with timestamp
 */
export function generateExportFilename(prefix: string): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
  return `${prefix}_${timestamp}.csv`;
}
