"use client";

export default function ProcessingIndicator({ rowCount }: { rowCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Mapping {rowCount} rows to GrowEasy CRM format with AI...
      </p>
      <p className="text-xs text-slate-400">
        This can take a little longer for large files — batches are processed
        sequentially with automatic retries.
      </p>
    </div>
  );
}
