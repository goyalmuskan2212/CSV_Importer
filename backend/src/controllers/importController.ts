import { Request, Response, NextFunction } from "express";
import { parseCsvToRows, CsvParseError } from "../services/csvParser";
import { extractCrmRecords } from "../services/aiExtractor";
import { CrmRecord, ImportResult, RawCsvRow, SkippedRecord } from "../types/crm";

function hasEmailOrMobile(record: CrmRecord): boolean {
  return Boolean(record.email.trim()) || Boolean(record.mobile_without_country_code.trim());
}

export async function handleCsvImport(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded. Use field name 'file'." });
    }

    const csvContent = req.file.buffer.toString("utf-8");
    const rows: RawCsvRow[] = parseCsvToRows(csvContent);

    if (rows.length > 2000) {
      return res.status(413).json({
        error: `CSV has ${rows.length} rows, which exceeds the 2000-row limit for this demo. Please split the file.`,
      });
    }

    const mappedRecords = await extractCrmRecords(rows);

    const imported: CrmRecord[] = [];
    const skipped: SkippedRecord[] = [];

    mappedRecords.forEach((record, i) => {
      if (hasEmailOrMobile(record)) {
        imported.push(record);
      } else {
        skipped.push({
          row: rows[i],
          reason: "No email or mobile number found in this row.",
        });
      }
    });

    const result: ImportResult = {
      imported,
      skipped,
      totalImported: imported.length,
      totalSkipped: skipped.length,
      totalRows: rows.length,
    };

    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof CsvParseError) {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
}
