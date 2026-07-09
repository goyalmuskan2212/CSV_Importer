import Groq from "groq-sdk";
import {
  CrmRecord,
  RawCsvRow,
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
} from "../types/crm";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_NAME = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const BATCH_SIZE = Number(process.env.AI_BATCH_SIZE || 10);
const MAX_RETRIES = 3;

const CRM_FIELD_KEYS: (keyof CrmRecord)[] = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

// Groq's JSON mode (response_format: json_object) guarantees valid JSON but,
// unlike OpenAI's json_schema mode, does NOT enforce enums or exact keys --
// so we describe the schema very explicitly in the prompt and then validate
// every field ourselves in sanitizeRecord() below before trusting the output.
const SYSTEM_PROMPT = `You are a data-mapping engine for GrowEasy CRM. You receive raw CSV rows exported from arbitrary sources (Facebook Lead Ads, Google Ads, real-estate CRMs, sales spreadsheets, manual sheets, etc.) with unpredictable, inconsistent, or ambiguous column names. Your job is to map each row's available fields onto GrowEasy's fixed CRM schema as accurately as possible.

You MUST respond with ONLY a JSON object of the exact shape:
{ "records": [ { "_idx": number, "created_at": string, "name": string, "email": string, "country_code": string, "mobile_without_country_code": string, "company": string, "city": string, "state": string, "country": string, "lead_owner": string, "crm_status": string, "crm_note": string, "data_source": string, "possession_time": string, "description": string }, ... ] }
No markdown, no code fences, no commentary -- valid JSON only.

RULES YOU MUST FOLLOW EXACTLY:

1. Field mapping: identify the best matching source column for each target field, even if names differ (e.g. "phone", "Contact No.", "Mobile Number", "WhatsApp" all mean mobile_without_country_code; "Full Name", "Lead Name", "Customer" all mean name). Use context and value shape (e.g. a 10-digit number is likely a phone; something with "@" is an email) when column names are unhelpful or generic (e.g. "Column1", "Field3").

2. crm_status: output ONLY one of these exact strings, or an empty string if nothing fits confidently: ${CRM_STATUS_VALUES.join(", ")}.

3. data_source: output ONLY one of these exact strings, or an empty string if nothing fits confidently: ${DATA_SOURCE_VALUES.join(", ")}. Do not guess -- leave blank unless there's a clear, confident match (e.g. a source/campaign column literally naming one of these).

4. created_at: must be a value parseable by JavaScript's 'new Date(...)'. Prefer ISO-like "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD". If no date is present in the row, leave it as an empty string -- never invent a date.

5. crm_note: use this field for anything useful that doesn't fit elsewhere -- remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses. If the row already implies a note/remarks column, start from that and append any overflow (extra emails/phones) after it.

6. Multiple emails or phone numbers in one row: use the FIRST email as 'email' and the FIRST phone as 'mobile_without_country_code'; append any remaining emails/phones into 'crm_note' clearly labeled (e.g. "Alt email: x@y.com").

7. country_code: extract if present as a separate column or as a prefix on the phone number (e.g. "+91"). If a phone number embeds a country code, split it out into country_code and put only the local number in mobile_without_country_code. If you cannot determine a country code, leave it blank -- do not assume +91 by default.

8. Never fabricate data. If a field has no reasonable source value, output an empty string "" for it -- do not guess names, emails, or locations that aren't implied by the row.

9. Output must be valid single-line strings (no raw newlines inside any field value) -- escape internal line breaks as \\n if truly needed.

10. Preserve row order: return exactly one mapped record per input row, using each row's given "_idx" to tag your output correctly.`;

type IndexedRecord = CrmRecord & { _idx: number };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function blankRecord(): CrmRecord {
  return {
    created_at: "",
    name: "",
    email: "",
    country_code: "",
    mobile_without_country_code: "",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "",
    crm_note: "",
    data_source: "",
    possession_time: "",
    description: "",
  };
}

/**
 * Groq's JSON mode doesn't enforce our schema the way OpenAI's json_schema
 * mode does, so every record coming back from the model is validated here:
 * missing keys are filled with "", and any crm_status/data_source value
 * outside the allowed enum is dropped to "" rather than trusted blindly.
 */
function sanitizeRecord(raw: Record<string, unknown>): CrmRecord {
  const clean = blankRecord();

  const mutable = clean as unknown as Record<string, string>;
  for (const key of CRM_FIELD_KEYS) {
    const value = raw[key];
    if (typeof value === "string") mutable[key] = value;
    else if (typeof value === "number") mutable[key] = String(value);
  }

  if (!(CRM_STATUS_VALUES as readonly string[]).includes(clean.crm_status)) {
    mutable.crm_status = "";
  }
  if (!(DATA_SOURCE_VALUES as readonly string[]).includes(clean.data_source)) {
    mutable.data_source = "";
  }

  return clean;
}

async function callWithRetry(batchRows: RawCsvRow[]): Promise<IndexedRecord[]> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify(
              batchRows.map((row, i) => ({ _idx: i, ...row }))
            ),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response from model");

      const parsed = JSON.parse(content) as { records: Record<string, unknown>[] };
      if (!Array.isArray(parsed.records)) {
        throw new Error("Model response missing 'records' array");
      }

      return parsed.records.map((r) => ({
        ...sanitizeRecord(r),
        _idx: typeof r._idx === "number" ? r._idx : -1,
      }));
    } catch (err) {
      lastErr = err;
      const backoffMs = 500 * 2 ** (attempt - 1);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }

  throw new Error(
    `AI extraction failed after ${MAX_RETRIES} attempts: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`
  );
}

export interface ExtractionProgress {
  batchIndex: number;
  totalBatches: number;
}

/**
 * Sends rows to the AI in batches and returns mapped CRM records in the
 * original row order. Does NOT apply the email/mobile skip rule -- that's
 * handled by the caller (importController) since it's a deterministic rule,
 * not something we want the model deciding.
 */
export async function extractCrmRecords(
  rows: RawCsvRow[],
  onProgress?: (progress: ExtractionProgress) => void
): Promise<CrmRecord[]> {
  const batches = chunk(rows, BATCH_SIZE);
  const results: CrmRecord[] = new Array(rows.length);

  for (let b = 0; b < batches.length; b++) {
    onProgress?.({ batchIndex: b + 1, totalBatches: batches.length });
    const batchResults = await callWithRetry(batches[b]);

    batchResults.forEach((rec, posInBatch) => {
      // Fall back to positional index if the model returned an invalid/missing _idx.
      const idx = rec._idx >= 0 && rec._idx < batches[b].length ? rec._idx : posInBatch;
      const globalIndex = b * BATCH_SIZE + idx;
      const { _idx, ...clean } = rec;
      if (globalIndex < results.length) results[globalIndex] = clean;
    });
  }

  // Defensive fallback: if the model dropped a row, fill with an all-blank
  // record so downstream indexing never breaks.
  for (let i = 0; i < results.length; i++) {
    if (!results[i]) results[i] = blankRecord();
  }

  return results;
}
