import { extractLeads } from "./ai.service";

import { CSVRow } from "../types/csv.types";
import { AIExtractionResult } from "../types/crm.types";

const DEFAULT_BATCH_SIZE = 20;

export async function processBatches(
  rows: CSVRow[],
  batchSize: number = DEFAULT_BATCH_SIZE
): Promise<AIExtractionResult> {
  const allRecords = [];
  const allSkipped = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} rows)`
    );

    const result = await extractLeads(batch);

    allRecords.push(...result.records);
    allSkipped.push(...result.skipped);
  }

  return {
    records: allRecords,
    skipped: allSkipped,
  };
}