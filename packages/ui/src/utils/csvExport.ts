/**
 * Shared CSV export utilities for BreederHQ modules
 */

/**
 * Escape a CSV value, wrapping in quotes if needed
 */
function escapeCsvValue(value: any): string {
  if (value == null) return "";

  const str = String(value);

  // If the string contains comma, quote, or newline, wrap it in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Format a value for CSV export based on its type
 */
function formatCsvValue(value: any): string {
  if (value == null) return "";

  // Arrays - join with |
  if (Array.isArray(value)) {
    return value.filter(v => v != null).join(" | ");
  }

  // Dates - convert to ISO YYYY-MM-DD if possible
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  // Check if it looks like an ISO date string
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }

  return String(value);
}

export type CsvColumn<T = any> = {
  key: string;
  label: string;
  [key: string]: any;
};

export type CsvExportOptions<T = any> = {
  /** Array of column definitions */
  columns: CsvColumn<T>[];
  /** Array of data rows to export */
  rows: T[];
  /** Filename (without .csv extension) */
  filename: string;
  /** Optional custom value formatter */
  formatValue?: (value: any, key: string, row: T) => string;
};

/**
 * Export data to CSV file
 *
 * Exports ALL columns defined in the columns array, including hidden ones.
 * Exports ALL rows in the rows array (typically the filtered dataset).
 */
export function exportToCsv<T = any>(options: CsvExportOptions<T>): void {
  const { columns, rows, filename, formatValue } = options;

  // Build header row
  const headers = columns.map(col => col.label);
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvValue).join(","));

  // Build data rows
  for (const row of rows) {
    const values = columns.map(col => {
      const rawValue = (row as any)[col.key];
      const formatted = formatValue
        ? formatValue(rawValue, col.key, row)
        : formatCsvValue(rawValue);
      return escapeCsvValue(formatted);
    });
    lines.push(values.join(","));
  }

  // Create blob and download
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
