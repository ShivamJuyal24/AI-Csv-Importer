import { Request, Response } from "express";

import { parseCsv } from "../services/csv.service";
import { processBatches } from "../services/batch.service";

export const uploadCsv = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Controller reached");

    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: "CSV file is required.",
      });
      return;
    }

    // Parse the uploaded CSV
    const rows = await parseCsv(file.buffer);

    // Process rows in AI batches
    const result = await processBatches(rows);

    res.status(200).json({
      success: true,
      message: "CSV processed successfully.",
      totalRows: rows.length,
      imported: result.records.length,
      skipped: result.skipped.length,
      data: result.records,
      skippedRecords: result.skipped,
    });
  } catch (error) {
    console.error("Upload Error:", error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Internal server error",
    });
  }
};