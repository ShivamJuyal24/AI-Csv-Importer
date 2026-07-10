import { Readable } from "stream";
import csv from "csv-parser";

import { CSVRow } from "../types/csv.types";

// Parses a CSV file buffer and returns an array of CSVRow objects
export async function parseCsv(buffer: Buffer): Promise<CSVRow[]> {
  return new Promise<CSVRow[]>((resolve, reject) => {
    const rows: CSVRow[] = [];

    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row) => {
        // Create a cleaned version of the row
        const trimmedRow: CSVRow = {};

        for (const [key, value] of Object.entries(row)) {
          trimmedRow[key.trim()] = String(value).trim();
        }

        // Skip completely empty rows
        const isEmptyRow = Object.values(trimmedRow).every(
          (value) => value === ""
        );

        if (!isEmptyRow) {
          rows.push(trimmedRow);
        }
      })
      .on("end", () => {
        if (rows.length === 0) {
          reject(new Error("The uploaded CSV is empty."));
          return;
        }

        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}