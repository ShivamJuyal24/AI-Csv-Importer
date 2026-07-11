import { extractLeads } from "./ai.service";

import { CSVRow } from "../types/csv.types";
import { AIExtractionResult } from "../types/crm.types";

const DEFAULT_BATCH_SIZE = 40;

export async function processBatches(
  rows: CSVRow[],
  batchSize: number = DEFAULT_BATCH_SIZE
): Promise<AIExtractionResult> {
  const batches: CSVRow[][] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  console.log(`Processing ${batches.length} batches sequentially`);

  const allRecords: AIExtractionResult["records"] = [];
  const allSkipped: AIExtractionResult["skipped"] = [];

  // Process one batch at a time (not in parallel) to stay under Groq's
  // tokens-per-minute (TPM) limit. Firing all batches simultaneously can
  // exceed TPM even when comfortably under the daily (TPD) limit.
  for (let index = 0; index < batches.length; index++) {
    const batch = batches[index];
    console.log(`Starting batch ${index + 1} (${batch.length} rows)`);

    try {
      const result = await extractLeads(batch);
      allRecords.push(...result.records);
      allSkipped.push(...result.skipped);
    } catch (error) {
      console.error(`Batch ${index + 1} failed:`, error);

      // Don't silently lose rows if a batch fails — push them to skipped
      // with a clear reason so the user knows this happened.
      batch.forEach((row) => {
        allSkipped.push({
          reason: "AI processing failed for this batch",
          record: row,
        });
      });
    }
  }

  return {
    records: allRecords,
    skipped: allSkipped,
  };
}