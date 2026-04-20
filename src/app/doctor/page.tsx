"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getPatientReports, getReportFile, getSensorHistory, getCallerRole } from "@/lib/api"
import { useWallet } from "@/lib/wallet"
import { Report, SensorRecord } from "@/types"
import {
  Loader2, Search, Download, Activity,
  FileText, ShieldCheck, ShieldX, RefreshCw,
} from "lucide-react"

export default function DoctorPage() {
  const { address, isConnected } = useWallet()

  const [patientId,     setPatientId]     = useState("")
  const [reports,       setReports]       = useState<Report[]>([])
  const [sensorData,    setSensorData]    = useState<SensorRecord[]>([])
  const [role,          setRole]          = useState<string | null>(null)
  const [searching,     setSearching]     = useState(false)
  const [sensorId,      setSensorId]      = useState("1")
  const [loadingSensor, setLoadingSensor] = useState(false)

  const handleSearch = async () => {
    if (!patientId) { toast.error("Enter a patient ID"); return }
    if (!address)   { toast.error("Connect your wallet first"); return }

    setSearching(true)
    setReports([])
    setSensorData([])
    setRole(null)

    try {
      // Step 1 — check role on-chain
      const roleRes = await getCallerRole(patientId, address)
      setRole(roleRes.role)

      if (roleRes.role === "none") {
        toast.error("Access denied", {
          description: `You do not have access to patient ${patientId}.`,
        })
        return
      }

      // Step 2 — fetch reports
      const reportsRes = await getPatientReports(patientId)
      setReports(reportsRes.reports || [])
      toast.success(`Loaded ${reportsRes.reports?.length || 0} reports for ${patientId}`)
    } catch (e: any) {
      toast.error("Failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setSearching(false)
    }
  }

  const handleLoadSensor = async () => {
    if (!patientId) { toast.error("Search for a patient first"); return }
    setLoadingSensor(true)
    try {
      const res = await getSensorHistory(Number(sensorId))
      setSensorData(res.records || [])
      toast.success(`Loaded ${res.records?.length || 0} sensor records`)
    } catch (e: any) {
      toast.error("Failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setLoadingSensor(false)
    }
  }

  const handleDownload = async (cid: string, nonce: string, type: string) => {
    try {
      const blob = await getReportFile(cid, nonce)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `report_${type}_${cid.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Report decrypted and downloaded")
    } catch (e: any) {
      toast.error("Download failed", { description: e.message })
    }
  }

  const roleColors: Record<string, string> = {
    owner:             "text-teal-700   bg-teal-50   border-teal-200",
    patient:           "text-blue-700   bg-blue-50   border-blue-200",
    doctor:            "text-purple-700 bg-purple-50 border-purple-200",
    emergency_contact: "text-amber-700  bg-amber-50  border-amber-200",
    none:              "text-red-700    bg-red-50    border-red-200",
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Doctor Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View patient reports and sensor data you have been granted access to
        </p>
      </div>

      {!isConnected && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 px-4 py-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Connect your MetaMask wallet — access is verified on-chain using your wallet address.
          </p>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Search patient</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Your wallet (used for access check)</Label>
            <p className="text-xs font-mono bg-muted px-3 py-2 rounded-md text-muted-foreground break-all">
              {address || "Not connected"}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Patient ID</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. P001"
                value={patientId}
                onChange={e => {
                  setPatientId(e.target.value)
                  setRole(null)
                  setReports([])
                  setSensorData([])
                }}
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !isConnected}
                className="bg-teal-600 hover:bg-teal-700 shrink-0"
              >
                {searching
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {role && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium capitalize ${roleColors[role] || ""}`}>
              {role === "none"
                ? <ShieldX className="w-4 h-4" />
                : <ShieldCheck className="w-4 h-4" />}
              Your access role: {role.replace("_", " ")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports */}
      {role && role !== "none" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Reports · {patientId}
              <span className="ml-2 text-muted-foreground font-normal">({reports.length})</span>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleSearch} disabled={searching}>
              {searching
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <RefreshCw className="w-3 h-3" />}
            </Button>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No reports found for this patient.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium capitalize">
                          {r.report_type.replace("_", " ")}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {r.is_active ? "active" : "inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        {r.ipfs_cid.slice(0, 28)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(r.ipfs_cid, r.nonce, r.report_type)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Decrypt
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sensor history */}
      {role && role !== "none" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Sensor history</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                className="w-20 h-8 text-xs"
                placeholder="ID"
                value={sensorId}
                onChange={e => setSensorId(e.target.value)}
              />
              <Button size="sm" variant="outline" onClick={handleLoadSensor} disabled={loadingSensor}>
                {loadingSensor
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Activity className="w-3 h-3" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sensorData.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Activity className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Enter a sensor ID and click load to view history.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sensorData.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium capitalize">
                          {r.data_type.replace("_", " ")}
                        </p>
                        <Badge variant="outline"
                          className={r.is_verified
                            ? "text-xs text-teal-600 border-teal-200"
                            : "text-xs text-amber-600 border-amber-200"}>
                          {r.is_verified ? "verified" : "pending"}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        {r.ipfs_cid.slice(0, 28)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      Sensor #{r.sensor_id}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}