import { extractLeads } from "./ai.service";

import { CSVRow } from "../types/csv.types";
import { AIExtractionResult } from "../types/crm.types";

const DEFAULT_BATCH_SIZE = 20;

export async function processBatches(
  rows: CSVRow[],
  batchSize: number = DEFAULT_BATCH_SIZE
): Promise<AIExtractionResult> {
  const batches: CSVRow[][] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  console.log(`Processing ${batches.length} batches in parallel`);

  const settledResults = await Promise.allSettled(
    batches.map((batch, index) => {
      console.log(`Starting batch ${index + 1} (${batch.length} rows)`);
      return extractLeads(batch);
    })
  );

  const allRecords: AIExtractionResult["records"] = [];
  const allSkipped: AIExtractionResult["skipped"] = [];

  settledResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      allRecords.push(...result.value.records);
      allSkipped.push(...result.value.skipped);
    } else {
      console.error(`Batch ${index + 1} failed:`, result.reason);

      // Don't silently lose rows if a batch fails — push them to skipped
      // with a clear reason so the user knows this happened.
      const failedBatch = batches[index];
      failedBatch.forEach((row) => {
        allSkipped.push({
          reason: "AI processing failed for this batch",
          record: row,
        });
      });
    }
  });

  return {
    records: allRecords,
    skipped: allSkipped,
  };
}