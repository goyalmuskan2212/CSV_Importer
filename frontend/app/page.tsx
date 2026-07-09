"use client";

import { useCallback, useEffect, useState } from "react";
import Papa from "papaparse";
import FileUpload from "../components/FileUpload";
import CsvPreviewTable from "../components/CsvPreviewTable";
import ResultsTable from "../components/ResultsTable";
import StepIndicator from "../components/StepIndicator";
import ProcessingIndicator from "../components/ProcessingIndicator";
import { importCsv, ApiError } from "../lib/api";
import { ImportResult, ImportStep, RawCsvRow } from "../lib/types";

export default function HomePage() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawCsvRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleFileSelected = useCallback((selected: File) => {
    setError(null);

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid .csv file.");
      return;
    }

    Papa.parse<RawCsvRow>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        if (parsed.errors.length && !parsed.data.length) {
          setError("Couldn't parse this CSV. Please check the file format.");
          return;
        }
        setFile(selected);
        setHeaders(parsed.meta.fields || []);
        setRows(parsed.data);
        setStep("preview");
      },
      error: () => {
        setError("Couldn't parse this CSV. Please check the file format.");
      },
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file) return;
    setStep("processing");
    setError(null);

    try {
      const res = await importCsv(file);
      setResult(res);
      setStep("results");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong during import.";
      setError(message);
      setStep("preview");
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setResult(null);
    setError(null);
    setStep("upload");
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            GrowEasy CSV Importer
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload any CSV export — AI maps it to CRM fields automatically.
          </p>
        </div>
        <button
          onClick={() => setIsDark((d) => !d)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle dark mode"
        >
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      <StepIndicator current={step} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {step === "upload" && (
          <FileUpload onFileSelected={handleFileSelected} error={error} />
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Preview</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {file?.name} — {rows.length} rows, {headers.length} columns
                  detected. Nothing has been sent to the AI yet.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Confirm & Import
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <CsvPreviewTable headers={headers} rows={rows} />
          </div>
        )}

        {step === "processing" && <ProcessingIndicator rowCount={rows.length} />}

        {step === "results" && result && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Import Results</h2>
              <button
                onClick={handleReset}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Import another file
              </button>
            </div>
            <ResultsTable result={result} />
          </div>
        )}
      </div>
    </main>
  );
}
