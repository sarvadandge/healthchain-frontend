"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { addEmergencyContact, removeEmergencyContact, getEmergencyContacts } from "@/lib/api"
import { EmergencyContact } from "@/types"
import { Loader2, UserPlus, Trash2, Phone, RefreshCw } from "lucide-react"

const RELATIONS = ["spouse", "parent", "sibling", "child", "friend", "guardian"]

export default function EmergencyContactsPage() {
  const [patientId, setPatientId] = useState("P001")
  const [contacts,  setContacts]  = useState<EmergencyContact[]>([])
  const [form,      setForm]      = useState({ contact_wallet: "", name: "", relation: "spouse" })
  const [adding,    setAdding]    = useState(false)
  const [removing,  setRemoving]  = useState<string | null>(null)
  const [fetching,  setFetching]  = useState(false)

  const handleAdd = async () => {
    if (!form.contact_wallet || !form.name) { toast.error("Fill in all fields"); return }
    setAdding(true)
    try {
      await addEmergencyContact({ patient_id: patientId, ...form })
      toast.success("Contact added", { description: `${form.name} can now view your reports.` })
      setForm({ contact_wallet: "", name: "", relation: "spouse" })
      await handleFetch()
    } catch (e: any) {
      toast.error("Failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (wallet: string) => {
    setRemoving(wallet)
    try {
      await removeEmergencyContact(patientId, wallet)
      toast.success("Contact removed")
      await handleFetch()
    } catch (e: any) {
      toast.error("Failed", { description: e.response?.data?.detail || e.message })
    } finally {
      setRemoving(null)
    }
  }

  const handleFetch = async () => {
    setFetching(true)
    try {
      const res = await getEmergencyContacts(patientId)
      setContacts(res.contacts || [])
    } catch (e: any) {
      toast.error("Failed to load", { description: e.response?.data?.detail || e.message })
    } finally {
      setFetching(false)
    }
  }

  const short = (addr: string) => `${addr.slice(0,6)}...${addr.slice(-4)}`

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Emergency Contacts</h1>
        <p className="text-sm text-muted-foreground mt-1">Up to 3 contacts — same access level as a doctor</p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 px-4 py-3">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Emergency contacts can view all your reports and sensor data. Only you can add or remove them.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Add emergency contact</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Your Patient ID</Label>
            <Input value={patientId} onChange={e => setPatientId(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact wallet address</Label>
            <Input placeholder="0x..." value={form.contact_wallet}
              onChange={e => setForm(f => ({ ...f, contact_wallet: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Rahul Dandge" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Relation</Label>
              <Select value={form.relation} onValueChange={v => setForm(f => ({ ...f, relation: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONS.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAdd} disabled={adding} className="w-full bg-teal-600 hover:bg-teal-700">
            {adding
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
              : <><UserPlus className="w-4 h-4 mr-2" />Add emergency contact</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Active contacts</CardTitle>
          <Button size="sm" variant="outline" onClick={handleFetch} disabled={fetching}>
            {fetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </Button>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Phone className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No contacts. Click refresh to load from chain.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-sm font-semibold text-teal-700 dark:text-teal-300">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs font-mono text-muted-foreground">{short(c.wallet)}</p>
                        <Badge variant="outline" className="text-xs capitalize">{c.relation}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={removing === c.wallet}
                    onClick={() => handleRemove(c.wallet)}>
                    {removing === c.wallet ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-right">{contacts.length}/3 slots used</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}