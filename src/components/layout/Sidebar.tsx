"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useWallet } from "@/lib/wallet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Activity, FileText,
  ShieldCheck, Phone, Stethoscope,
  Wallet, LogOut, ChevronRight, UserRound, PhoneCall,
} from "lucide-react"

const NAV = [
  { href: "/dashboard",          label: "Dashboard",          icon: LayoutDashboard, badge: null  },
  { href: "/sensor",             label: "Sensor Data",        icon: Activity,        badge: null  },
  { href: "/reports",            label: "Patient Reports",    icon: FileText,        badge: null  },
  { href: "/verify",             label: "Verify Integrity",   icon: ShieldCheck,     badge: null  },
  { href: "/emergency-contacts", label: "Emergency Contacts", icon: Phone,           badge: null  },
  { href: "/doctor-access",      label: "Doctor Access",      icon: Stethoscope,     badge: null  },
  { href: "/doctor",             label: "Doctor Portal",      icon: UserRound,       badge: "MD"  },
  { href: "/emergency-portal",   label: "Emergency Portal",   icon: PhoneCall,       badge: "EC"  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWallet()
  const short  = address ? `${address.slice(0,6)}...${address.slice(-4)}` : null
  const isAmoy = chainId === 80002

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-background flex flex-col shrink-0">

      {/* Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">HealthChain</p>
            <p className="text-xs text-muted-foreground">IoT · Blockchain · IPFS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                active
                  ? "bg-teal-50 text-teal-700 font-medium dark:bg-teal-950 dark:text-teal-300"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                badge && !active ? "border border-dashed border-border" : ""
              )}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3" />}
                {badge && !active && (
                  <Badge variant="outline" className={cn(
                    "text-xs px-1.5 py-0 h-4",
                    href === "/doctor"           && "text-purple-600 border-purple-200",
                    href === "/emergency-portal" && "text-amber-600  border-amber-200",
                  )}>
                    {badge}
                  </Badge>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Wallet */}
      <div className="p-4 border-t border-border space-y-2">
        {isConnected ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-xs font-mono text-muted-foreground">{short}</span>
              </div>
              <Badge variant={isAmoy ? "default" : "destructive"} className="text-xs">
                {isAmoy ? "Amoy" : `Chain ${chainId}`}
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={disconnect}>
              <LogOut className="w-3 h-3 mr-2" />Disconnect
            </Button>
          </>
        ) : (
          <Button size="sm" className="w-full text-xs bg-teal-600 hover:bg-teal-700"
            onClick={connect} disabled={isConnecting}>
            <Wallet className="w-3 h-3 mr-2" />
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </Button>
        )}
      </div>
    </aside>
  )
}