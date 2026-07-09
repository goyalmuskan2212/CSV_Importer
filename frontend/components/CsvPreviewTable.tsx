"use client";

import { RawCsvRow } from "../lib/types";

interface CsvPreviewTableProps {
  headers: string[];
  rows: RawCsvRow[];
  maxRows?: number;
}

export default function CsvPreviewTable({
  headers,
  rows,
  maxRows = 100,
}: CsvPreviewTableProps) {
  const displayRows = rows.slice(0, maxRows);

  return (
    <div className="w-full">
      <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left font-semibold text-slate-500 w-12">
                #
              </th>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200"
                >
                  {h || <span className="italic text-slate-400">(blank)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr
                key={i}
                className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800"
              >
                <td className="sticky left-0 bg-inherit px-3 py-2 text-slate-400">
                  {i + 1}
                </td>
                {headers.map((h) => (
                  <td
                    key={h}
                    className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-300 max-w-[240px] overflow-hidden text-ellipsis"
                  >
                    {row[h] || <span className="text-slate-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <p className="mt-2 text-xs text-slate-400">
          Showing first {maxRows} of {rows.length} rows.
        </p>
      )}
    </div>
  );
}
