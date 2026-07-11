"use client";

import { CSVRow } from "@/types/csv";

interface SkippedRecord {
  reason: string;
  record: CSVRow;
}

interface SkippedTableProps {
  skipped: SkippedRecord[];
}

export default function SkippedTable({
  skipped,
}: SkippedTableProps) {
  if (skipped.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="mb-4 text-2xl font-semibold">
        Skipped Records
      </h2>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="border-b px-4 py-3 text-left">
                Reason
              </th>

              <th className="border-b px-4 py-3 text-left">
                Record
              </th>
            </tr>
          </thead>

          <tbody>
            {skipped.map((item, index) => (
              <tr key={index}>
                <td className="border-b px-4 py-3">
                  {item.reason}
                </td>

                <td className="border-b px-4 py-3">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(item.record, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}