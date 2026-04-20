"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { grantDoctorAccess, revokeDoctorAccess, checkDoctorAccess } from "@/lib/api"
import { Loader2, Stethoscope, ShieldCheck, ShieldX } from "lucide-react"

export default function DoctorAccessPage() {
  const [patientId,     setPatientId]     = useState("P001")
  const [doctorAddress, setDoctorAddress] = useState("")
  const [checkAddress,  setCheckAddress]  = useState("")
  const [granting,      setGranting]      = useState(false)
  const [revoking,      setRevoking]      = useState(false)
  const [checking,      setChecking]      = useState(false)
  const [checkResult,   setCheckResult]   = useState<boolean | null>(null)
  const [grantedDocs,   setGrantedDocs]   = useState<string[]>([])

  const handleGrant = async () => {
    if (!doctorAddress) { toast.error("Enter doctor address"); return }
    setGranting(true)
    try {
      await grantDoctorAccess(patientId, doctorAddress)
      toast.success("Access granted", { description: "Doctor can now view your reports." })
      setGrantedDocs(prev => [...new Set([...prev, doctorAddress])])
      setDoctorAddress("")
    } catch (e: any) {
      toast.error("Failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setGranting(false)
    }
  }

  const handleRevoke = async (addr?: string) => {
    const target = addr || doctorAddress
    if (!target) { toast.error("Enter doctor address"); return }
    setRevoking(true)
    try {
      await revokeDoctorAccess(patientId, target)
      toast.success("Access revoked")
      setGrantedDocs(prev => prev.filter(d => d !== target))
      if (!addr) setDoctorAddress("")
    } catch (e: any) {
      toast.error("Failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setRevoking(false)
    }
  }

  const handleCheck = async () => {
    if (!checkAddress) { toast.error("Enter an address"); return }
    setChecking(true)
    try {
      const res = await checkDoctorAccess(patientId, checkAddress)
      setCheckResult(res.has_access)
    } catch (e: any) {
      toast.error("Failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setChecking(false)
    }
  }

  const short = (addr: string) => `${addr.slice(0,6)}...${addr.slice(-4)}`

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Doctor Access</h1>
        <p className="text-sm text-muted-foreground mt-1">Grant or revoke doctors access to your reports</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Manage access</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Your Patient ID</Label>
            <Input value={patientId} onChange={e => setPatientId(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Doctor wallet address</Label>
            <Input placeholder="0x..." value={doctorAddress} onChange={e => setDoctorAddress(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleGrant} disabled={granting} className="flex-1 bg-teal-600 hover:bg-teal-700">
              {granting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Granting...</>
                : <><ShieldCheck className="w-4 h-4 mr-2" />Grant access</>}
            </Button>
            <Button onClick={() => handleRevoke()} disabled={revoking} variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
              {revoking
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Revoking...</>
                : <><ShieldX className="w-4 h-4 mr-2" />Revoke access</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {grantedDocs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Granted this session</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {grantedDocs.map((addr, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <p className="text-sm font-mono">{short(addr)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-teal-600 border-teal-200">active</Badge>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 px-2"
                    onClick={() => handleRevoke(addr)} disabled={revoking}>
                    <ShieldX className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Check access</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Wallet address to check</Label>
            <Input placeholder="0x..." value={checkAddress}
              onChange={e => { setCheckAddress(e.target.value); setCheckResult(null) }} />
          </div>
          <Button onClick={handleCheck} disabled={checking} variant="outline" className="w-full">
            {checking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</> : "Check access on-chain"}
          </Button>
          {checkResult !== null && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium
              ${checkResult
                ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:text-red-300"}`}>
              {checkResult ? <ShieldCheck className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />}
              {checkResult ? "Access granted" : "No access"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}