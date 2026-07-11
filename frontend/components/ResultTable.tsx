"use client";

import { useState, Fragment } from "react";
import { CRMLead } from "@/types/crm";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ResultTableProps {
  data: CRMLead[];
}

const DETAIL_FIELDS: { key: keyof CRMLead; label: string }[] = [
  { key: "created_at", label: "Created At" },
  { key: "country_code", label: "Country Code" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "lead_owner", label: "Lead Owner" },
  { key: "crm_note", label: "CRM Note" },
  { key: "data_source", label: "Data Source" },
  { key: "possession_time", label: "Possession Time" },
  { key: "description", label: "Description" },
];

export default function ResultTable({ data }: ResultTableProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showRawJson, setShowRawJson] = useState<Record<number, boolean>>({});

  if (data.length === 0) return null;

  const toggleRow = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const toggleRawJson = (index: number) => {
    setShowRawJson((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="mt-10">
      <h2 className="mb-4 text-2xl font-semibold">Imported CRM Records</h2>

      <div className="max-h-[600px] overflow-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-100">
            <tr>
              <th className="border-b px-2 py-3 w-8"></th>
              <th className="border-b px-4 py-3 text-left">Name</th>
              <th className="border-b px-4 py-3 text-left">Email</th>
              <th className="border-b px-4 py-3 text-left">Mobile</th>
              <th className="border-b px-4 py-3 text-left">Company</th>
              <th className="border-b px-4 py-3 text-left">City</th>
              <th className="border-b px-4 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {data.map((lead, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <Fragment key={index}>
                  <tr
                    onClick={() => toggleRow(index)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="border-b px-2 py-3 text-center text-slate-400">
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </td>
                    <td className="border-b px-4 py-3">{lead.name || "-"}</td>
                    <td className="border-b px-4 py-3">{lead.email || "-"}</td>
                    <td className="border-b px-4 py-3">
                      {lead.country_code
                        ? `${lead.country_code} ${lead.mobile_without_country_code}`
                        : lead.mobile_without_country_code || "-"}
                    </td>
                    <td className="border-b px-4 py-3">{lead.company || "-"}</td>
                    <td className="border-b px-4 py-3">{lead.city || "-"}</td>
                    <td className="border-b px-4 py-3">
                      {lead.crm_status ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                          {lead.crm_status}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-slate-50">
                      <td colSpan={7} className="border-b px-6 py-4">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-3">
                          {DETAIL_FIELDS.map(({ key, label }) => (
                            <div key={key}>
                              <p className="text-xs font-medium text-slate-400">
                                {label}
                              </p>
                              <p className="text-sm text-slate-700 break-words">
                                {(lead[key] as string) || "-"}
                              </p>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRawJson(index);
                          }}
                          className="mt-4 text-xs font-medium text-blue-600 hover:underline"
                        >
                          {showRawJson[index] ? "Hide raw JSON" : "View raw JSON"}
                        </button>

                        {showRawJson[index] && (
                          <pre className="mt-2 max-w-full overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
                            {JSON.stringify(lead, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}