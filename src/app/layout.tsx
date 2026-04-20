import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/lib/wallet"
import Sidebar from "@/components/layout/Sidebar"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HealthChain — IoT Data Integrity",
  description: "Secure healthcare IoT data verification using Blockchain and IPFS",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-8 overflow-auto">
              {children}
            </main>
          </div>
          <Toaster richColors position="top-right" />
        </WalletProvider>
      </body>
    </html>
  )
}