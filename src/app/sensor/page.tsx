"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { uploadSensorData, verifySensorData, getSensorHistory } from "@/lib/api"
import { SensorRecord } from "@/types"
import { Loader2, Upload, ShieldCheck, RefreshCw } from "lucide-react"

const DATA_TYPES = [
  { value: "heart_rate",     label: "Heart rate",    unit: "bpm"     },
  { value: "spo2",           label: "SpO2",           unit: "%"       },
  { value: "temperature",    label: "Temperature",    unit: "celsius" },
  { value: "blood_pressure", label: "Blood pressure", unit: "mmHg"   },
]

function HashBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xs font-mono bg-muted px-3 py-2 rounded-md break-all">{value}</p>
    </div>
  )
}

export default function SensorPage() {
  const [form, setForm] = useState({
    sensor_id: "1", data_type: "heart_rate",
    value: "87.5", unit: "bpm", patient_id: "P001", location: "ICU Ward 3",
  })
  const [verifyForm, setVerifyForm]   = useState({ sensor_id: "1", record_index: "0", cid: "" })
  const [result,        setResult]        = useState<any>(null)
  const [verifyResult,  setVerifyResult]  = useState<any>(null)
  const [history,       setHistory]       = useState<SensorRecord[]>([])
  const [loading,       setLoading]       = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [histLoading,   setHistLoading]   = useState(false)

  const handleTypeChange = (val: string) => {
    const dt = DATA_TYPES.find(d => d.value === val)
    setForm(f => ({ ...f, data_type: val, unit: dt?.unit || "" }))
  }

  const handleUpload = async () => {
    setLoading(true)
    try {
      const res = await uploadSensorData({
        sensor_id: Number(form.sensor_id), data_type: form.data_type,
        value: Number(form.value), unit: form.unit,
        patient_id: form.patient_id, location: form.location,
      })
      setResult(res)
      toast.success("Sensor data uploaded", { description: "Stored on IPFS and blockchain." })
    } catch (e: any) {
      toast.error("Upload failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verifyForm.cid) { toast.error("Enter a CID"); return }
    setVerifyLoading(true)
    try {
      const res = await verifySensorData({
        sensor_id: Number(verifyForm.sensor_id),
        record_index: Number(verifyForm.record_index),
        cid: verifyForm.cid,
      })
      setVerifyResult(res)
      toast.success("Integrity verified on-chain")
    } catch (e: any) {
      toast.error("Verify failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleHistory = async () => {
    setHistLoading(true)
    try {
      const res = await getSensorHistory(Number(form.sensor_id))
      setHistory(res.records || [])
      toast.success(`Loaded ${res.records?.length || 0} records`)
    } catch (e: any) {
      toast.error("Failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setHistLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sensor Data</h1>
        <p className="text-sm text-muted-foreground mt-1">Submit ESP32 sensor readings to IPFS and blockchain</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Submit reading</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sensor ID</Label>
              <Input value={form.sensor_id} onChange={e => setForm(f => ({ ...f, sensor_id: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Data type</Label>
              <Select value={form.data_type} onValueChange={handleTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Patient ID</Label>
              <Input value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4 mr-2" />Upload to IPFS + Blockchain</>}
            </Button>
            <Button onClick={handleHistory} disabled={histLoading} variant="outline">
              {histLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
          {result && (
            <div className="space-y-2 pt-2 border-t border-border">
              <HashBox label="IPFS CID"        value={result.cid}       />
              <HashBox label="SHA-256 hash"    value={result.data_hash} />
              <HashBox label="Transaction hash"value={result.tx_hash}   />
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Sensor {form.sensor_id} history</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {history.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="text-sm font-medium capitalize">{r.data_type.replace("_", " ")}</p>
                  <p className="text-xs font-mono text-muted-foreground">{r.ipfs_cid.slice(0, 24)}...</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.timestamp * 1000).toLocaleString()}</p>
                </div>
                <Badge variant="outline" className={r.is_verified ? "text-teal-600 border-teal-200" : "text-amber-600 border-amber-200"}>
                  {r.is_verified ? "verified" : "pending"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Verify integrity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sensor ID</Label>
              <Input value={verifyForm.sensor_id} onChange={e => setVerifyForm(f => ({ ...f, sensor_id: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Record index</Label>
              <Input value={verifyForm.record_index} onChange={e => setVerifyForm(f => ({ ...f, record_index: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>IPFS CID</Label>
            <Input placeholder="QmXKJ92..." value={verifyForm.cid} onChange={e => setVerifyForm(f => ({ ...f, cid: e.target.value }))} />
          </div>
          <Button onClick={handleVerify} disabled={verifyLoading} variant="outline" className="w-full">
            {verifyLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : <><ShieldCheck className="w-4 h-4 mr-2" />Verify on-chain</>}
          </Button>
          {verifyResult && (
            <div className="space-y-2 pt-2 border-t border-border">
              <HashBox label="Computed hash" value={verifyResult.computed_hash} />
              <HashBox label="Transaction hash" value={verifyResult.tx_hash} />
              <p className="text-xs text-muted-foreground">Integrity result is stored on-chain via <code className="bg-muted px-1 rounded">verifySensorIntegrity()</code></p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}