"use client";

import { CRMLead } from "@/types/crm";

interface ResultTableProps {
  data: CRMLead[];
}

export default function ResultTable({ data }: ResultTableProps) {
  if (data.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="mb-4 text-2xl font-semibold">
        Imported CRM Records
      </h2>

      <div className="max-h-[500px] overflow-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-100">
            <tr>
              <th className="border-b px-4 py-3 text-left">Name</th>
              <th className="border-b px-4 py-3 text-left">Email</th>
              <th className="border-b px-4 py-3 text-left">Mobile</th>
              <th className="border-b px-4 py-3 text-left">Company</th>
              <th className="border-b px-4 py-3 text-left">City</th>
              <th className="border-b px-4 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {data.map((lead, index) => (
              <tr
                key={index}
                className="hover:bg-slate-50"
              >
                <td className="border-b px-4 py-3">
                  {lead.name || "-"}
                </td>

                <td className="border-b px-4 py-3">
                  {lead.email || "-"}
                </td>

                <td className="border-b px-4 py-3">
                  {lead.mobile_without_country_code || "-"}
                </td>

                <td className="border-b px-4 py-3">
                  {lead.company || "-"}
                </td>

                <td className="border-b px-4 py-3">
                  {lead.city || "-"}
                </td>

                <td className="border-b px-4 py-3">
                  {lead.crm_status || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}