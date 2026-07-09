"use client";

import { useState } from "react";
import { CrmRecord, ImportResult } from "../lib/types";

const CRM_COLUMNS: { key: keyof CrmRecord; label: string }[] = [
  { key: "created_at", label: "Created At" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country_code", label: "Country Code" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "lead_owner", label: "Lead Owner" },
  { key: "crm_status", label: "Status" },
  { key: "crm_note", label: "Note" },
  { key: "data_source", label: "Source" },
  { key: "possession_time", label: "Possession Time" },
  { key: "description", label: "Description" },
];

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  SALE_DONE:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  DID_NOT_CONNECT:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  BAD_LEAD: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-slate-300">—</span>;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function ResultsTable({ result }: { result: ImportResult }) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  return (
    <div className="w-full">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard label="Total Rows" value={result.totalRows} tone="neutral" />
        <StatCard
          label="Imported"
          value={result.totalImported}
          tone="success"
        />
        <StatCard label="Skipped" value={result.totalSkipped} tone="warning" />
      </div>

      <div className="mb-3 flex gap-2">
        <TabButton
          active={tab === "imported"}
          onClick={() => setTab("imported")}
        >
          Imported ({result.totalImported})
        </TabButton>
        <TabButton
          active={tab === "skipped"}
          onClick={() => setTab("skipped")}
        >
          Skipped ({result.totalSkipped})
        </TabButton>
      </div>

      {tab === "imported" ? (
        <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left font-semibold text-slate-500 w-12">
                  #
                </th>
                {CRM_COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.imported.map((rec, i) => (
                <tr
                  key={i}
                  className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="sticky left-0 bg-inherit px-3 py-2 text-slate-400">
                    {i + 1}
                  </td>
                  {CRM_COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      className="whitespace-nowrap px-3 py-2 max-w-[220px] overflow-hidden text-ellipsis text-slate-600 dark:text-slate-300"
                    >
                      {c.key === "crm_status" ? (
                        <StatusBadge status={rec[c.key]} />
                      ) : (
                        rec[c.key] || <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {result.imported.length === 0 && (
                <tr>
                  <td
                    colSpan={CRM_COLUMNS.length + 1}
                    className="px-3 py-8 text-center text-slate-400"
                  >
                    No records were imported.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 w-12">
                  #
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Reason
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Original Row
                </th>
              </tr>
            </thead>
            <tbody>
              {result.skipped.map((s, i) => (
                <tr
                  key={i}
                  className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 align-top"
                >
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 text-red-600 dark:text-red-400 whitespace-nowrap">
                    {s.reason}
                  </td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {JSON.stringify(s.row)}
                  </td>
                </tr>
              ))}
              {result.skipped.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center text-slate-400"
                  >
                    Nothing was skipped — great data!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning";
}) {
  const toneClasses = {
    neutral:
      "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200",
    success:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300",
  }[tone];

  return (
    <div className={`rounded-xl p-4 ${toneClasses}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-500 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
