import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
})

// ─── Sensor ───────────────────────────────────────────────────

export const uploadSensorData = (data: {
  sensor_id:  number
  data_type:  string
  value:      number
  unit:       string
  patient_id: string
  location:   string
}) => api.post("/sensor/upload", data).then(r => r.data)

export const verifySensorData = (data: {
  sensor_id:    number
  record_index: number
  cid:          string
}) => api.post("/sensor/verify", data).then(r => r.data)

export const getLatestSensorRecord = (sensorId: number) =>
  api.get(`/sensor/${sensorId}/latest`).then(r => r.data)

export const getSensorHistory = (sensorId: number) =>
  api.get(`/sensor/${sensorId}/history`).then(r => r.data)

export const getSensorCount = (sensorId: number) =>
  api.get(`/sensor/${sensorId}/count`).then(r => r.data)

// ─── Reports ──────────────────────────────────────────────────

export const uploadReport = (formData: FormData) =>
  api.post("/patient/upload-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data)

export const getPatientReports = (patientId: string) =>
  api.get(`/patient/${patientId}/reports`).then(r => r.data)

export const getReportFile = (cid: string, nonce: string) =>
  api.get(`/patient/get-report/${cid}`, {
    params: { nonce },
    responseType: "blob",
  }).then(r => r.data)

// ─── Doctor Access ────────────────────────────────────────────

export const grantDoctorAccess = (patient_id: string, doctor_address: string) =>
  api.post("/patient/grant-doctor", { patient_id, doctor_address }).then(r => r.data)

export const revokeDoctorAccess = (patient_id: string, doctor_address: string) =>
  api.post("/patient/revoke-doctor", { patient_id, doctor_address }).then(r => r.data)

export const checkDoctorAccess = (patientId: string, doctorAddress: string) =>
  api.get(`/patient/${patientId}/check-doctor/${doctorAddress}`).then(r => r.data)

// ─── Emergency Contacts ───────────────────────────────────────

export const addEmergencyContact = (data: {
  patient_id:     string
  contact_wallet: string
  name:           string
  relation:       string
}) => api.post("/patient/emergency-contact/add", data).then(r => r.data)

export const removeEmergencyContact = (patient_id: string, contact_wallet: string) =>
  api.post("/patient/emergency-contact/remove", { patient_id, contact_wallet }).then(r => r.data)

export const getEmergencyContacts = (patientId: string) =>
  api.get(`/patient/${patientId}/emergency-contacts`).then(r => r.data)

// ─── Role + Status ────────────────────────────────────────────

export const getCallerRole = (patient_id: string, caller_address: string) =>
  api.post("/patient/role", { patient_id, caller_address }).then(r => r.data)

export const getStatus = () =>
  api.get("/status").then(r => r.data)