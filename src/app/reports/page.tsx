"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { uploadReport, getPatientReports, getReportFile } from "@/lib/api"
import { Report } from "@/types"
import { Loader2, Upload, Download, FileText, RefreshCw } from "lucide-react"

type ReportType = "lab_report" | "prescription" | "xray" | "scan"

const REPORT_TYPES: ReportType[] = ["lab_report", "prescription", "xray", "scan"]

export default function ReportsPage() {
  const [patientId, setPatientId] = useState("P001")
  const [reportType, setReportType] = useState<ReportType>("lab_report")
  const [file, setFile] = useState<File | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select a file first")
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("patient_id", patientId)
      fd.append("report_type", reportType)
      fd.append("file", file)

      const res = await uploadReport(fd)
      setUploadResult(res)

      toast.success("Report uploaded", {
        description: "Encrypted on IPFS + stored on blockchain."
      })
    } catch (e: any) {
      toast.error("Upload failed", {
        description: e.response?.data?.detail || e.message
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFetch = async () => {
    setFetching(true)
    try {
      const res = await getPatientReports(patientId)
      setReports(res.reports || [])
      toast.success(`Loaded ${res.reports?.length || 0} reports`)
    } catch (e: any) {
      toast.error("Failed to load", {
        description: e.response?.data?.detail || e.message
      })
    } finally {
      setFetching(false)
    }
  }

  const handleDownload = async (cid: string, nonce: string, type: string) => {
    try {
      const blob = await getReportFile(cid, nonce)
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `report_${type}_${cid.slice(0, 8)}.pdf`
      a.click()

      URL.revokeObjectURL(url)

      toast.success("Report decrypted and downloaded")
    } catch (e: any) {
      toast.error("Download failed", { description: e.message })
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Patient Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload and view encrypted healthcare reports
        </p>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Upload report</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Patient ID</Label>
              <Input value={patientId} onChange={e => setPatientId(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Report type</Label>

              <Select
                value={reportType}
                onValueChange={(v) =>
                  setReportType((v ?? "lab_report") as ReportType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {REPORT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                      {t.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            onClick={() => document.getElementById("file-input")?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
          >
            <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : "Click to select PDF or image"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Encrypted with AES-256-GCM before upload
            </p>

            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,image/*"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Encrypting + uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Encrypt + Upload
              </>
            )}
          </Button>

          {uploadResult && (
            <div className="space-y-2 pt-2 border-t border-border">
              {[
                ["IPFS CID (encrypted)", uploadResult.cid],
                ["File hash (original)", uploadResult.file_hash],
                ["Transaction hash", uploadResult.tx_hash],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-xs font-mono bg-muted px-3 py-2 rounded-md break-all">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Stored reports · {patientId}
          </CardTitle>

          <Button size="sm" variant="outline" onClick={handleFetch} disabled={fetching}>
            {fetching ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        </CardHeader>

        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No reports loaded. Click refresh to fetch from chain.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
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
                      {r.ipfs_cid.slice(0, 24)}...
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {new Date(r.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDownload(r.ipfs_cid, r.nonce, r.report_type)
                    }
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Decrypt
                  </Button>
                </div>
              ))}

              <p className="text-xs text-muted-foreground text-right">
                {reports.length} report(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
