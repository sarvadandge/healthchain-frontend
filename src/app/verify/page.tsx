"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { verifySensorData, getCallerRole } from "@/lib/api"
import { useWallet } from "@/lib/wallet"
import { Loader2, ShieldCheck, ShieldX, CheckCircle2 } from "lucide-react"

const roleColors: Record<string, string> = {
  owner:             "text-teal-700   bg-teal-50   border-teal-200",
  patient:           "text-blue-700   bg-blue-50   border-blue-200",
  doctor:            "text-purple-700 bg-purple-50 border-purple-200",
  emergency_contact: "text-amber-700  bg-amber-50  border-amber-200",
  none:              "text-red-700    bg-red-50    border-red-200",
}

export default function VerifyPage() {
  const { address } = useWallet()

  const [form,     setForm]     = useState({ sensor_id: "1", record_index: "0", cid: "" })
  const [roleForm, setRoleForm] = useState({ patient_id: "P001", caller_address: address || "" })
  const [result,      setResult]      = useState<any>(null)
  const [roleResult,  setRoleResult]  = useState<any>(null)
  const [loading,     setLoading]     = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)

  const handleVerify = async () => {
    if (!form.cid) { toast.error("Enter a CID"); return }
    setLoading(true)
    try {
      const res = await verifySensorData({
        sensor_id: Number(form.sensor_id),
        record_index: Number(form.record_index),
        cid: form.cid,
      })
      setResult(res)
      toast.success("Integrity verified and stored on-chain")
    } catch (e: any) {
      toast.error("Verify failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleCheck = async () => {
    setRoleLoading(true)
    try {
      const res = await getCallerRole(roleForm.patient_id, roleForm.caller_address)
      setRoleResult(res)
    } catch (e: any) {
      toast.error("Check failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setRoleLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verify Integrity</h1>
        <p className="text-sm text-muted-foreground mt-1">Detect tampering by comparing on-chain and IPFS hashes</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">How it works</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {[
              "Fetch sensor data from IPFS using the CID",
              "Recompute SHA-256 hash of the downloaded JSON",
              "Call verifySensorIntegrity() on the smart contract",
              "Contract compares stored hash with computed hash",
              "Match = data intact ✅   Mismatch = tampered ❌",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Verify sensor data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sensor ID</Label>
              <Input value={form.sensor_id} onChange={e => setForm(f => ({ ...f, sensor_id: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Record index</Label>
              <Input value={form.record_index} onChange={e => setForm(f => ({ ...f, record_index: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>IPFS CID</Label>
            <Input placeholder="QmXKJ92..." value={form.cid} onChange={e => setForm(f => ({ ...f, cid: e.target.value }))} />
          </div>
          <Button onClick={handleVerify} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700">
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
              : <><ShieldCheck className="w-4 h-4 mr-2" />Verify integrity</>}
          </Button>
          {result && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 dark:bg-teal-950 border border-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <p className="text-sm text-teal-700 font-medium">Verification submitted on-chain</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Computed hash</p>
                <p className="text-xs font-mono bg-muted px-3 py-2 rounded-md break-all">{result.computed_hash}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Transaction hash</p>
                <p className="text-xs font-mono bg-muted px-3 py-2 rounded-md break-all">{result.tx_hash}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Check access role</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Patient ID</Label>
              <Input value={roleForm.patient_id} onChange={e => setRoleForm(f => ({ ...f, patient_id: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Wallet address</Label>
              <Input placeholder="0x..." value={roleForm.caller_address}
                onChange={e => { setRoleForm(f => ({ ...f, caller_address: e.target.value })); setRoleResult(null) }} />
            </div>
          </div>
          <Button onClick={handleRoleCheck} disabled={roleLoading} variant="outline" className="w-full">
            {roleLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</> : "Check role on-chain"}
          </Button>
          {roleResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium capitalize ${roleColors[roleResult.role] || ""}`}>
              {roleResult.role === "none" ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              Role: {roleResult.role.replace("_", " ")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}