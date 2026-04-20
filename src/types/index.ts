export interface SensorRecord {
  sensor_id:   number
  ipfs_cid:    string
  data_hash:   string
  data_type:   string
  uploader:    string
  timestamp:   number
  is_verified: boolean
}

export interface Report {
  report_id:   number
  patient_id:  string
  ipfs_cid:    string
  file_hash:   string
  report_type: string
  nonce:       string
  uploaded_by: string
  timestamp:   number
  is_active:   boolean
}

export interface EmergencyContact {
  wallet:    string
  name:      string
  relation:  string
  is_active: boolean
}

export type Role = "owner" | "patient" | "doctor" | "emergency_contact" | "none"