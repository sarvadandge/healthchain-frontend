"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, FileText, ShieldCheck, Phone, Wifi } from "lucide-react"
import { useWallet } from "@/lib/wallet"
import { getStatus } from "@/lib/api"

export default function DashboardPage() {
  const { address, isConnected, chainId } = useWallet()
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    getStatus().then(setStatus).catch(() => {})
  }, [])

  const stats = [
    { label: "Contract",       value: status ? "Live"  : "—",  sub: status?.contract_address?.slice(0,10)+"..." || "loading", icon: ShieldCheck },
    { label: "Network",        value: status ? "Amoy"  : "—",  sub: `Chain ${status?.chain_id || "—"}`,                       icon: Wifi        },
    { label: "Wallet Balance", value: status ? `${Number(status.balance_matic).toFixed(3)} MATIC` : "—", sub: "backend wallet", icon: Activity    },
    { label: "IPFS + Chain",   value: "Active", sub: "Pinata + Polygon",                                                       icon: FileText    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">HealthChain — IoT data integrity · Blockchain + IPFS</p>
      </div>

      {!isConnected && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 px-4 py-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Connect your MetaMask wallet using the sidebar to interact with the blockchain.
          </p>
        </div>
      )}

      {isConnected && chainId !== 80002 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 px-4 py-3">
          <p className="text-sm text-red-800 dark:text-red-200">
            Wrong network — switch to Polygon Amoy (Chain ID: 80002).
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono truncate">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">System status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Blockchain",       ok: !!status?.connected  },
              { label: "Smart contract",   ok: !!status?.contract_address },
              { label: "Wallet connected", ok: isConnected           },
              { label: "Correct network",  ok: chainId === 80002     },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Badge variant="outline" className={ok
                  ? "text-teal-600 border-teal-200 bg-teal-50"
                  : "text-red-600 border-red-200 bg-red-50"}>
                  {ok ? "ok" : "check"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Contract info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Address",  value: status?.contract_address || "—" },
              { label: "Network",  value: `Polygon Amoy (${status?.chain_id || "—"})` },
              { label: "Backend",  value: status?.wallet?.slice(0,10)+"..." || "—" },
              { label: "Balance",  value: status ? `${Number(status.balance_matic).toFixed(4)} MATIC` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-xs font-mono text-right max-w-[180px] truncate">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {isConnected && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Connected wallet</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs font-mono text-muted-foreground break-all">{address}</p>
            <p className="text-xs text-muted-foreground mt-1">Chain ID: {chainId}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}