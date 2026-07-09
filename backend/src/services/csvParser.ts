import { parse } from "csv-parse/sync";
import { RawCsvRow } from "../types/crm";

export class CsvParseError extends Error {}

/**
 * Parses a raw CSV buffer/string into an array of row objects, keyed by
 * whatever headers the file actually has. We do NOT assume fixed column
 * names here -- that mapping is the AI's job.
 */
export function parseCsvToRows(csvContent: string): RawCsvRow[] {
  let records: RawCsvRow[];

  try {
    records = parse(csvContent, {
      columns: (header: string[]) => header.map((h) => h.trim()),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // tolerate ragged rows from messy exports
      bom: true,
    });
  } catch (err) {
    throw new CsvParseError(
      `Failed to parse CSV: ${err instanceof Error ? err.message : "unknown error"}`
    );
  }

  if (!records.length) {
    throw new CsvParseError("CSV file contains no data rows.");
  }

  // Drop rows where every cell is empty (common in exports with trailing blank lines).
  return records.filter((row) =>
    Object.values(row).some((v) => v && v.trim().length > 0)
  );
}
