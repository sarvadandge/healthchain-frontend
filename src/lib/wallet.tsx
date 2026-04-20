"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { ethers } from "ethers"

interface WalletContextType {
  address:      string | null
  isConnected:  boolean
  isConnecting: boolean
  chainId:      number | null
  connect:      () => Promise<void>
  disconnect:   () => void
  signer:       ethers.Signer | null
}

const WalletContext = createContext<WalletContextType>({
  address:      null,
  isConnected:  false,
  isConnecting: false,
  chainId:      null,
  connect:      async () => {},
  disconnect:   () => {},
  signer:       null,
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address,      setAddress]      = useState<string | null>(null)
  const [signer,       setSigner]       = useState<ethers.Signer | null>(null)
  const [chainId,      setChainId]      = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("MetaMask not found. Please install it.")
      return
    }
    setIsConnecting(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const s       = await provider.getSigner()
      const addr    = await s.getAddress()
      const network = await provider.getNetwork()
      setSigner(s)
      setAddress(addr)
      setChainId(Number(network.chainId))
      localStorage.setItem("wallet_connected", "true")
    } catch (err) {
      console.error("Wallet connect failed:", err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setSigner(null)
    setChainId(null)
    localStorage.removeItem("wallet_connected")
  }

  useEffect(() => {
    if (localStorage.getItem("wallet_connected") === "true") connect()

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) disconnect()
        else connect()
      })
      window.ethereum.on("chainChanged", () => connect())
    }
  }, [])

  return (
    <WalletContext.Provider value={{
      address, isConnected: !!address, isConnecting, chainId, connect, disconnect, signer,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)