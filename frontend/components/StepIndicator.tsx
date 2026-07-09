"use client";

import { ImportStep } from "../lib/types";

const STEPS: { key: ImportStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "processing", label: "Processing" },
  { key: "results", label: "Results" },
];

export default function StepIndicator({ current }: { current: ImportStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors
                  ${
                    isDone
                      ? "bg-brand-500 text-white"
                      : isActive
                      ? "border-2 border-brand-500 text-brand-600 dark:text-brand-500"
                      : "border-2 border-slate-200 text-slate-400 dark:border-slate-700"
                  }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  isActive
                    ? "font-semibold text-slate-700 dark:text-slate-200"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-12 ${
                  isDone ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
