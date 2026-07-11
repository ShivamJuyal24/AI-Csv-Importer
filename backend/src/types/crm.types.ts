import { CSVRow } from "./csv.types";

export interface CRMLead {
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
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface AIExtractionResult {
  records: CRMLead[];
  skipped: {
    reason: string;
    record: CSVRow;
  }[];
}