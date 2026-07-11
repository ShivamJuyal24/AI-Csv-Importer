import groq from "../lib/groq";

import { CSVRow } from "../types/csv.types";
import { AIExtractionResult } from "../types/crm.types";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `
You are an AI data extraction engine. Convert raw CSV records into the GrowEasy CRM format.

Input: an array of CSV row objects, each tagged with "row_index" (0-based). Column names vary between files — map by meaning, not exact string match.

Column mapping examples:
"Full Name"/"Customer Name"/"Lead Name"/"Client Name" → name
"Email"/"Email Address"/"Work Email" → email
"Phone"/"Phone Number"/"Mobile"/"Contact Number" → mobile_without_country_code
"Company"/"Organization"/"Business" → company
"Remarks"/"Comments"/"Notes"/"Follow Up" → crm_note

Rules:
1. Never invent data. Unclear value → empty string.
2. Skip a record ONLY if BOTH email AND phone are missing.
3. Phone with country code (e.g. "+91 9876543210") → country_code: "+91", mobile_without_country_code: "9876543210". No code → country_code empty.
4. Multiple emails in one field (separated by /, ,, or, &): keep first in "email", append rest to crm_note as "Alt email: X". Never more than one email in the email field.
5. Multiple phones in one field: keep first (digits only, no spaces) in mobile_without_country_code, append rest to crm_note as "Alt phone: X". Never more than one number in that field. Append to existing crm_note content rather than overwrite.
6. crm_status — ONLY one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE. Infer semantically from notes:
   - "will call back", "interested", "asked to reschedule" → GOOD_LEAD_FOLLOW_UP
   - "did not pick up", "unreachable", "no response" → DID_NOT_CONNECT
   - "not interested", "wrong number", "bought elsewhere" → BAD_LEAD
   - "deal closed", "payment done", "confirmed booking" → SALE_DONE
   Leave blank if genuinely ambiguous — never guess.
7. data_source — ONLY one of these exact values: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. Match by meaning (e.g. "Meridian Tower Ads" → meridian_tower). Any non-matching value (e.g. "Facebook", "Instagram", "Walk-in") → empty string. Never pass through the raw source value.
8. created_at — valid date string parseable by JS "new Date()" (e.g. "2026-05-13"). Resolve ambiguous dates using context if possible; otherwise best-effort parse. Empty if unavailable.
9. Keep every value on a single line.
10. possession_time — short phrase close to source wording (e.g. "wants possession by Dec 2026" → "Dec 2026"; "ready to move in immediately" → "Immediate"). Keep the full original sentence in crm_note too. Empty if no such info.
11. CRITICAL: Process each row fully independently. Never reuse or infer a value from a different row. If unsure, leave empty rather than borrowing from a nearby row.
12. Every object in "records" and "skipped" must include "source_row_index" copied exactly from the input row's "row_index" — never guessed.
13. Return ONLY valid JSON, exactly this structure:

{
  "records": [
    {
      "source_row_index": 0,
      "created_at": "", "name": "", "email": "", "country_code": "",
      "mobile_without_country_code": "", "company": "", "city": "", "state": "",
      "country": "", "lead_owner": "", "crm_status": "", "crm_note": "",
      "data_source": "", "possession_time": "", "description": ""
    }
  ],
  "skipped": [
    { "source_row_index": 0, "reason": "", "record": {} }
  ]
}
`;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s+()-]/g, "");
}

function isValueFromRow(value: string, row: CSVRow): boolean {
  if (!value) return true; // empty is always fine, nothing to verify
  const rowValues = Object.values(row).join(" ");
  return normalize(rowValues).includes(normalize(value));
}

function validateAgainstSource(
  extractionResult: AIExtractionResult,
  originalRows: CSVRow[]
): AIExtractionResult {
  extractionResult.records.forEach((record: any) => {
    const sourceRow = originalRows[record.source_row_index];

    if (!sourceRow) {
      // Can't verify — index missing or out of range, be conservative
      return;
    }

    if (!isValueFromRow(record.mobile_without_country_code, sourceRow)) {
      console.warn(
        `Row ${record.source_row_index}: mobile "${record.mobile_without_country_code}" not found in source, discarding`
      );
      record.mobile_without_country_code = "";
      record.crm_note = (
        record.crm_note + " [Warning: mobile could not be verified against source]"
      ).trim();
    }

    if (!isValueFromRow(record.email, sourceRow)) {
      console.warn(
        `Row ${record.source_row_index}: email "${record.email}" not found in source, discarding`
      );
      record.email = "";
      record.crm_note = (
        record.crm_note + " [Warning: email could not be verified against source]"
      ).trim();
    }

    // Strip internal-only field before returning to frontend
    delete record.source_row_index;
  });

  extractionResult.skipped.forEach((item: any) => {
    delete item.source_row_index;
  });

  return extractionResult;
}

export async function extractLeads(
  rows: CSVRow[]
): Promise<AIExtractionResult> {
  const taggedRows = rows.map((row, index) => ({
    row_index: index,
    ...row,
  }));

  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `
Convert these CSV rows into GrowEasy CRM records.

CSV Rows:

${JSON.stringify(taggedRows, null, 2)}
`,
      },
    ],
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("Empty response from Groq.");
  }

  let result: unknown;

  try {
    result = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON.");
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("records" in result) ||
    !("skipped" in result)
  ) {
    throw new Error("AI returned an invalid response structure.");
  }

  const extractionResult = result as AIExtractionResult;

  if (!Array.isArray(extractionResult.records)) {
    throw new Error("'records' must be an array.");
  }

  if (!Array.isArray(extractionResult.skipped)) {
    throw new Error("'skipped' must be an array.");
  }

  return validateAgainstSource(extractionResult, rows);
}