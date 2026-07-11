interface SummaryCardsProps {
  totalRows: number;
  imported: number;
  skipped: number;
}

export default function SummaryCards({
  totalRows,
  imported,
  skipped,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Rows",
      value: totalRows,
    },
    {
      title: "Imported",
      value: imported,
    },
    {
      title: "Skipped",
      value: skipped,
    },
  ];

  return (
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-lg border bg-white p-6 shadow-sm"
        >
          <p className="text-sm text-gray-500">
            {card.title}
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}