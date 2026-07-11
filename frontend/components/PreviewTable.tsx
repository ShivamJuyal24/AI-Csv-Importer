"use client";

interface PreviewTableProps {
  data: Record<string, string>[];
}

export default function PreviewTable({ data }: PreviewTableProps) {
  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-2xl font-semibold">
        CSV Preview
      </h2>

      <div className="max-h-[500px] overflow-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="border-b px-4 py-3 text-left font-semibold whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className="border-b px-4 py-3 whitespace-nowrap"
                  >
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}