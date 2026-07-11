import groq from "../lib/groq";

import { CSVRow } from "../types/csv.types";
import { AIExtractionResult } from "../types/crm.types";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `
You are an AI data extraction engine.

Your task is to convert raw CSV records into the GrowEasy CRM format.

The input is an array of CSV row objects. Column names are NOT fixed and may vary between different CSV files.

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

4. If multiple email addresses exist:
Use the first one.
Append remaining emails into crm_note.

5. If multiple phone numbers exist:
Use the first phone number.
Append remaining phone numbers into crm_note.

6. crm_status must ONLY be one of:

GOOD_LEAD_FOLLOW_UP
DID_NOT_CONNECT
BAD_LEAD
SALE_DONE

Otherwise return an empty string.

7. data_source must ONLY be one of:

leads_on_demand
meridian_tower
eden_park
varah_swamy
sarjapur_plots

Otherwise return an empty string.

8. created_at must be a valid date string if available.
Otherwise return an empty string.

9. Keep every value on a single line.

10. Return ONLY valid JSON.

Return exactly this structure:

{
  "records": [
    {
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
      "reason": "",
      "record": {}
    }
  ]
}
`;

export async function extractLeads(
  rows: CSVRow[]
): Promise<AIExtractionResult> {
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

${JSON.stringify(rows, null, 2)}
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

  return extractionResult;
}