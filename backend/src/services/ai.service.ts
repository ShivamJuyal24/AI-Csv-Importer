import groq from "../lib/groq";

import { CSVRow } from "../types/csv.types";
import { AIExtractionResult } from "../types/crm.types";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `
You are an AI data extraction engine.

Your task is to convert raw CSV records into the GrowEasy CRM format.

The input is an array of CSV row objects, each tagged with a "row_index"
field indicating its position in the original file (0-based). Column names
are NOT fixed and may vary between different CSV files.

Examples:

"Full Name", "Customer Name", "Lead Name", "Client Name" → name

"Email", "Email Address", "Work Email" → email

"Phone", "Phone Number", "Mobile", "Mobile Number", "Contact Number" → mobile_without_country_code

"Company", "Organization", "Business" → company

"Remarks", "Comments", "Notes", "Follow Up" → crm_note

Extract as many fields as possible from each row.

Rules:

1. Never invent information.
If a value cannot be confidently extracted, leave it as an empty string.

2. A record is VALID if it contains:
- an email
OR
- a phone/mobile number

Only skip a record when BOTH are missing.

3. If a phone number contains a country code:

Example:
+91 9876543210

Return

country_code = "+91"

mobile_without_country_code = "9876543210"

If there is no country code,
leave country_code empty.

4. If multiple email addresses exist in a single value (separated by "/", ",", "or", "&", or similar):
   - Use ONLY the first email as the email field.
   - Append each remaining email into crm_note, clearly labeled.
   - Never leave more than one email inside the email field.

   Example:
   Input email field: "arjun@menon.co / arjun.m@gmail.com"
   Output:
     email: "arjun@menon.co"
     crm_note: "Alt email: arjun.m@gmail.com"

   If crm_note already has content from another rule, append this as an
   additional sentence rather than overwriting it.

5. If multiple phone numbers exist in a single value (separated by "/", ",", "or", "&", or similar):
   - Use ONLY the first number as mobile_without_country_code.
   - Append each remaining number into crm_note, clearly labeled.
   - Never leave more than one number inside mobile_without_country_code.
     Strip spaces so the field contains digits only.

   Example:
   Input phone field: "9123456780 / 9123456781"
   Output:
     mobile_without_country_code: "9123456780"
     crm_note: "Alt phone: 9123456781"

   If crm_note already has content from another rule, append this as an
   additional sentence rather than overwriting it.

6. crm_status must ONLY be one of:
   GOOD_LEAD_FOLLOW_UP
   DID_NOT_CONNECT
   BAD_LEAD
   SALE_DONE

   Infer this from any notes, remarks, or comments field using semantic
   understanding, not just literal keyword matching. For example:
   - "will call back", "interested", "wants brochure", "asked to reschedule" → GOOD_LEAD_FOLLOW_UP
   - "did not pick up", "unreachable", "busy, try later", "no response" → DID_NOT_CONNECT
   - "not interested", "wrong number", "already bought elsewhere" → BAD_LEAD
   - "deal closed", "payment done", "confirmed booking", "sale done" → SALE_DONE

   Only leave this blank if the note gives no reasonable signal either way.
   Do not guess if genuinely ambiguous — prefer blank over a wrong status.

7. data_source must ONLY be one of these EXACT values:
   leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots

   Match based on meaning, not exact string equality (e.g. "Meridian Tower
   Ads" → meridian_tower). However, you must NEVER output any value outside
   this list, even if the source data has a source-like column (e.g.
   "Facebook", "Instagram", "Google Ads", "Walk-in"). If the value doesn't
   map to one of the five project names above, output an empty string.
   Do not pass through the raw source value under any circumstances.

   Example:
   Input: "Instagram" → data_source: "" (NOT "Instagram")
   Input: "Facebook" → data_source: "" (NOT "Facebook")
   Input: "Meridian Tower Ads" → data_source: "meridian_tower"

8. created_at must be a valid date string if available, in a format
   parseable by JavaScript's "new Date()" (e.g. "2026-05-13" or
   "2026-05-13T10:32:00+05:30"). If the source date is ambiguous
   (e.g. "05/13/2026" could be May 13 or an invalid day-month order),
   resolve using context where possible; otherwise make a reasonable
   best-effort parse. Otherwise return an empty string.

9. Keep every value on a single line.

10. possession_time should capture any mention of expected property
    possession timing, extracted as a short phrase (do not paraphrase
    heavily, keep close to source wording).

    Examples:
    "wants possession by Dec 2026" → possession_time: "Dec 2026"
    "ready to move in immediately" → possession_time: "Immediate"
    "possession expected Q4 2026" → possession_time: "Q4 2026"

    If a possession-related phrase is found, extract it into
    possession_time AND still keep the full original sentence in
    crm_note for context — do not remove it from crm_note.

    If no possession-related information exists, leave possession_time
    empty.

11. CRITICAL: Process each row completely independently. Never use, infer,
    or carry over any value (name, phone, email, or any other field) from
    a different row in the input array. Every value in your output for a
    given record must come only from that record's own input data. If you
    are unsure of a value, leave it empty rather than reusing a nearby
    row's value.

12. Every object in "records" and "skipped" must include a "source_row_index"
    field set to the "row_index" value of the input row it came from. This
    must be copied exactly as given — never guessed or recalculated.

13. Return ONLY valid JSON.

Return exactly this structure:

{
  "records": [
    {
      "source_row_index": 0,
      "created_at": "",
      "name": "",
      "email": "",
      "country_code": "",
      "mobile_without_country_code": "",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": [
    {
      "source_row_index": 0,
      "reason": "",
      "record": {}
    }
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