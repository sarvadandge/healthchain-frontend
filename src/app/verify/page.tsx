"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { verifySensorData, getCallerRole } from "@/lib/api"
import { useWallet } from "@/lib/wallet"
import { Loader2, ShieldCheck, ShieldX, CheckCircle2 } from "lucide-react"

type VerifyResult = {
  computed_hash: string
  tx_hash: string
}

type RoleResult = {
  role: "owner" | "patient" | "doctor" | "emergency_contact" | "none"
}

const roleColors: Record<string, string> = {
  owner: "text-teal-700 bg-teal-50 border-teal-200",
  patient: "text-blue-700 bg-blue-50 border-blue-200",
  doctor: "text-purple-700 bg-purple-50 border-purple-200",
  emergency_contact: "text-amber-700 bg-amber-50 border-amber-200",
  none: "text-red-700 bg-red-50 border-red-200",
}

export default function VerifyPage() {
  const { address } = useWallet()

  const [form, setForm] = useState({
    sensor_id: "1",
    record_index: "0",
    cid: "",
  })

  const [roleForm, setRoleForm] = useState({
    patient_id: "P001",
    caller_address: "",
  })

  const [result, setResult] = useState<VerifyResult | null>(null)
  const [roleResult, setRoleResult] = useState<RoleResult | null>(null)

  const [loading, setLoading] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)

  // Sync wallet address automatically
  useEffect(() => {
    if (address) {
      setRoleForm(prev => ({ ...prev, caller_address: address }))
    }
  }, [address])

  const handleVerify = async () => {
    if (!form.cid.trim()) {
      toast.error("Enter a valid CID")
      return
    }

    setLoading(true)
    try {
      const res = await verifySensorData({
        sensor_id: Number(form.sensor_id),
        record_index: Number(form.record_index),
        cid: form.cid.trim(),
      })

      setResult(res)

      toast.success("Integrity verified and stored on-chain")
    } catch (e: any) {
      toast.error("Verify failed", {
        description: e.response?.data?.detail || e.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleCheck = async () => {
    if (!roleForm.patient_id || !roleForm.caller_address) {
      toast.error("Fill all fields")
      return
    }

    setRoleLoading(true)
    try {
      const res = await getCallerRole(
        roleForm.patient_id,
        roleForm.caller_address
      )

      setRoleResult(res)
    } catch (e: any) {
      toast.error("Check failed", {
        description: e.response?.data?.detail || e.message,
      })
    } finally {
      setRoleLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verify Integrity</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detect tampering by comparing on-chain and IPFS hashes
        </p>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">How it works</CardTitle>
        </CardHeader>

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
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Verify */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Verify sensor data</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              value={form.sensor_id}
              onChange={e => setForm(f => ({ ...f, sensor_id: e.target.value }))}
            />
            <Input
              value={form.record_index}
              onChange={e => setForm(f => ({ ...f, record_index: e.target.value }))}
            />
          </div>

          <Input
            placeholder="IPFS CID"
            value={form.cid}
            onChange={e => setForm(f => ({ ...f, cid: e.target.value }))}
          />

          <Button onClick={handleVerify} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <ShieldCheck className="mr-2" />
            )}
            Verify integrity
          </Button>

          {result && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 border border-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <p className="text-sm font-medium text-teal-700">
                  Verification submitted on-chain
                </p>
              </div>

              <div className="text-xs font-mono break-all">
                {result.computed_hash}
              </div>

              <div className="text-xs font-mono break-all">
                {result.tx_hash}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Check access role</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              value={roleForm.patient_id}
              onChange={e => setRoleForm(f => ({ ...f, patient_id: e.target.value }))}
            />
            <Input
              value={roleForm.caller_address}
              onChange={e => {
                setRoleForm(f => ({ ...f, caller_address: e.target.value }))
                setRoleResult(null)
              }}
            />
          </div>

          <Button onClick={handleRoleCheck} disabled={roleLoading} variant="outline">
            {roleLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            Check role
          </Button>

          {roleResult && (
            <div
              className={`p-3 rounded-lg border text-sm font-medium capitalize ${
                roleColors[roleResult.role]
              }`}
            >
              {roleResult.role === "none" ? (
                <ShieldX className="inline mr-2" />
              ) : (
                <ShieldCheck className="inline mr-2" />
              )}
              {roleResult.role}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
