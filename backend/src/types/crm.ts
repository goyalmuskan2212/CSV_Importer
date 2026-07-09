export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

/**
 * A single CRM record in GrowEasy's target format.
 * All fields are optional except the ones we validate post-hoc
 * (a record must have at least an email or a mobile number).
 */
export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus | "";
  crm_note: string;
  data_source: DataSource | "";
  possession_time: string;
  description: string;
}

/** Raw row as parsed from the uploaded CSV -- arbitrary column names/values. */
export type RawCsvRow = Record<string, string>;

export interface ImportResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  totalRows: number;
}

export interface SkippedRecord {
  row: RawCsvRow;
  reason: string;
}

export interface BatchProcessingProgress {
  batchIndex: number;
  totalBatches: number;
  status: "pending" | "processing" | "done" | "failed";
}
