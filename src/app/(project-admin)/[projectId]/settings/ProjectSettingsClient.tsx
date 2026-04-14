"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Banknote, CalendarClock, Bell, LayoutGrid, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface ProjectSettingsClientProps {
  projectId: string
  project: any
  paymentSchedule: any
  penaltyConfig: any
  notificationConfig: any
  adminProfile: any
}

export function ProjectSettingsClient({
  projectId,
  project,
  paymentSchedule,
  penaltyConfig,
  notificationConfig,
  adminProfile,
}: ProjectSettingsClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isSetup = project.status === "SETUP"

  // -- Tab 1: Profile State --
  const [name, setName] = useState(project.name || "")
  const [address, setAddress] = useState(project.address || "")
  const [area, setArea] = useState(project.area || "")
  const [handover, setHandover] = useState(project.expected_handover ? project.expected_handover.split('T')[0] : "")
  
  // -- Tab 2: Payment Model --
  const [paymentType, setPaymentType] = useState(paymentSchedule?.type || "MONTHLY")
  const [monthlyAmount, setMonthlyAmount] = useState(paymentSchedule?.monthly_amount?.toString() || "")
  const [dueDay, setDueDay] = useState(paymentSchedule?.due_day?.toString() || "10")

  // -- Tab 3: Penalties --
  const [graceDays, setGraceDays] = useState(penaltyConfig?.grace_days?.toString() || "5")
  const [penaltyType, setPenaltyType] = useState(penaltyConfig?.penalty_type || "NONE")
  const [fixedAmount, setFixedAmount] = useState(penaltyConfig?.fixed_amount?.toString() || "")

  // -- Tab 5: My Profile --
  const [myName, setMyName] = useState(adminProfile?.name || "")
  const [myPhone, setMyPhone] = useState(adminProfile?.phone || "")
  const [myProfession, setMyProfession] = useState(adminProfile?.profession || "")
  const [myDesignation, setMyDesignation] = useState(adminProfile?.designation || "")
  const [myOrganization, setMyOrganization] = useState(adminProfile?.organization || "")
  const [myAddress, setMyAddress] = useState(adminProfile?.present_address || "")
  const [myWhatsapp, setMyWhatsapp] = useState(adminProfile?.whatsapp_no || "")

  // -- Tab 4: Notifications --
  const rawReminders = Array.isArray(notificationConfig?.reminder_days) ? notificationConfig.reminder_days : []
  const [sevenDays, setSevenDays] = useState(rawReminders.includes(7))
  const [threeDays, setThreeDays] = useState(rawReminders.includes(3))
  const [oneDay, setOneDay] = useState(rawReminders.includes(1))
  const [sameDay, setSameDay] = useState(rawReminders.includes(0))
  const [overdue, setOverdue] = useState(notificationConfig?.overdue_reminder ?? true)

  // -- Handlers --
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/settings`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ name, address, area, expected_handover: handover || null })
      })
      if (!res.ok) throw new Error("Failed to save project profile")
      toast.success("Profile saved successfully")
    } catch(err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePaymentModel = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/payment-schedule`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
           type: paymentType, 
           monthly_amount: monthlyAmount, 
           due_day: dueDay 
         })
      })
      if (!res.ok) throw new Error("Failed to save payment model")
      toast.success("Payment model saved")
    } catch(err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateSchedule = async () => {
    if(!confirm("Generate schedule items based on the current configuration?")) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-schedule`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
    } catch(err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePenalties = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/penalty-config`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
           grace_days: graceDays,
           penalty_type: penaltyType,
           fixed_amount: fixedAmount
         })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save penalty config");
      }
      toast.success("Penalties configuration saved")
    } catch(err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const days = []
      if(sevenDays) days.push(7)
      if(threeDays) days.push(3)
      if(oneDay) days.push(1)
      if(sameDay) days.push(0)

      const res = await fetch(`/api/projects/${projectId}/notification-config`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
           reminder_days: days,
           overdue_reminder: overdue,
           email_enabled: true,
           in_app_enabled: true
         })
      })
      if (!res.ok) throw new Error("Failed to save notification config")
      toast.success("Notifications configuration saved")
    } catch(err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAdminProfile = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/profiles/${adminProfile?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: myName,
          phone: myPhone,
          profession: myProfession,
          designation: myDesignation,
          organization: myOrganization,
          present_address: myAddress,
          whatsapp_no: myWhatsapp,
        })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      toast.success("Profile updated successfully.")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-surface border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-outline-variant/40">
        <h2 className="text-xl font-bold text-on-surface">Project Settings</h2>
        <p className="text-sm text-on-surface-variant mt-1">Configure project rules, schedules, and automated communications.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <div className="bg-surface-variant/30 border-b border-outline-variant/40 px-4">
          <TabsList className="flex flex-row h-auto bg-transparent p-0 m-0 w-full justify-start overflow-x-auto no-scrollbar">
            <TabsTrigger 
              value="profile" 
              className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none font-medium transition-all"
            >
              <Building className="h-4 w-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger 
              value="payment" 
              className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none font-medium transition-all"
            >
              <Banknote className="h-4 w-4 mr-2" /> Payment Model
            </TabsTrigger>
            <TabsTrigger 
              value="penalties" 
              className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none font-medium transition-all"
            >
              <CalendarClock className="h-4 w-4 mr-2" /> Penalties
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none font-medium transition-all"
            >
              <Bell className="h-4 w-4 mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger
              value="profile-me"
              className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none font-medium transition-all"
            >
              <User className="h-4 w-4 mr-2" /> My Profile
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6 md:p-8">
          
          {/* TAB 1: PROFILE */}
          <TabsContent value="profile" className="m-0 focus:outline-none">
             <div className="max-w-2xl">
                <div className="mb-6 pb-6 border-b border-outline-variant/40 flex items-center gap-4">
                  <div className="p-3 bg-primary-container/50 rounded-xl">
                    <LayoutGrid className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-on-surface">Project Details</h3>
                    <p className="text-sm text-on-surface-variant">ID: {projectId.slice(0,8)}... • Created {new Date(project.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address / Location</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="area">Land Area</Label>
                        <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 10 Katha" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="handover">Expected Handover</Label>
                        <Input id="handover" type="date" value={handover} onChange={(e) => setHandover(e.target.value)} />
                      </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="mt-4 bg-primary hover:bg-primary/90">
                    {isLoading ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
             </div>
          </TabsContent>

          {/* TAB 2: PAYMENT MODEL */}
          <TabsContent value="payment" className="m-0 focus:outline-none">
             <div className="max-w-2xl">
               <div className="mb-6">
                <h3 className="text-lg font-medium text-on-surface">Payment Collection Model</h3>
                <p className="text-sm text-on-surface-variant mt-1">Determine how shareholders are billed for the project cost.</p>
               </div>

                <form onSubmit={handleSavePaymentModel} className="space-y-6 border-b pb-6">
                  <div className="grid gap-2">
                    <Label>Model Type</Label>
                    <Select value={paymentType} onValueChange={(v) => setPaymentType(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly Fixed Amount</SelectItem>
                        <SelectItem value="MILESTONE">Milestone Based</SelectItem>
                        <SelectItem value="MIXED">Mixed (Monthly + Milestones)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentType === "MONTHLY" || paymentType === "MIXED" ? (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-surface-variant/30 rounded-lg border border-outline-variant/40">
                       <div className="grid gap-2">
                          <Label htmlFor="monthly_amount">Monthly Amount (৳)</Label>
                          <Input id="monthly_amount" type="number" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} placeholder="e.g. 50000" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="due_day">Due Day of Month</Label>
                          <Input id="due_day" type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="1-28" />
                        </div>
                    </div>
                  ) : null}
                  
                  {paymentType === "MILESTONE" && (
                    <div className="p-4 bg-tertiary-container/30 text-on-tertiary-container rounded-lg text-sm">
                      Note: Milestone amounts will be configured directly on the Milestones page once enabled.
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading} className="mt-4 bg-primary hover:bg-primary/90">
                    {isLoading ? "Saving Setup..." : "Save Setup"}
                  </Button>
                </form>

                <div className="pt-6">
                   <h4 className="text-sm font-medium text-on-surface mb-2">Schedule Generation</h4>
                   <p className="text-sm text-on-surface-variant mb-4">Run the engine to generate upcoming invoices based on current active shareholders and rules.</p>
                   <Button variant="outline" onClick={handleGenerateSchedule} disabled={isLoading}>
                      Generate Schedule Items
                   </Button>
                </div>
             </div>
          </TabsContent>

          {/* TAB 3: PENALTIES */}
          <TabsContent value="penalties" className="m-0 focus:outline-none">
             <div className="max-w-2xl">
               <div className="mb-6">
                <h3 className="text-lg font-medium text-on-surface">Late Payment Penalties</h3>
                <p className="text-sm text-on-surface-variant mt-1">Configure automated late fees for overdue payments.</p>
               </div>

                <form onSubmit={handleSavePenalties} className="space-y-6">
                  
                  <div className="grid gap-2">
                    <Label htmlFor="grace_days">Grace Period (Days)</Label>
                    <Input id="grace_days" type="number" min="0" value={graceDays} onChange={(e) => setGraceDays(e.target.value)} placeholder="e.g. 5" className="max-w-[200px]" />
                    <p className="text-xs text-on-surface-variant">Number of days after due date before penalties apply.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Penalty Type</Label>
                    <Select value={penaltyType} onValueChange={(v) => setPenaltyType(v ?? "")}>
                      <SelectTrigger className="max-w-[300px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">No Penalties</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount (Monthly Setup)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {penaltyType === "FIXED_AMOUNT" && (
                    <div className="grid gap-2 bg-surface-variant/30 p-4 rounded border">
                       <Label htmlFor="fixed_amount">Fixed Penalty Amount (৳)</Label>
                       <Input id="fixed_amount" type="number" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} className="max-w-[200px]" />
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading} className="mt-4 bg-primary hover:bg-primary/90">
                    {isLoading ? "Saving..." : "Save Penalty Config"}
                  </Button>
                </form>
             </div>
          </TabsContent>

          {/* TAB 4: NOTIFICATIONS */}
          <TabsContent value="notifications" className="m-0 focus:outline-none">
             <div className="max-w-2xl">
               <div className="mb-6">
                <h3 className="text-lg font-medium text-on-surface">Automated Reminders</h3>
                <p className="text-sm text-on-surface-variant mt-1">Configure when system sends payment reminders to shareholders.</p>
               </div>

                <form onSubmit={handleSaveNotifications} className="space-y-6">
                  
                  <div className="space-y-3">
                     <Label className="text-base">Pre-Due Reminders</Label>
                     <p className="text-sm text-on-surface-variant mb-3">Send emails X days before payment is due:</p>
                     
                     <div className="flex items-center space-x-2">
                        <Checkbox id="7days" checked={sevenDays} onCheckedChange={(c) => setSevenDays(!!c)} />
                        <label htmlFor="7days" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">7 days before</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="3days" checked={threeDays} onCheckedChange={(c) => setThreeDays(!!c)} />
                        <label htmlFor="3days" className="text-sm font-medium leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">3 days before</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="1day" checked={oneDay} onCheckedChange={(c) => setOneDay(!!c)} />
                        <label htmlFor="1day" className="text-sm font-medium leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">1 day before</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="0day" checked={sameDay} onCheckedChange={(c) => setSameDay(!!c)} />
                        <label htmlFor="0day" className="text-sm font-medium leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">On due date (0 days)</label>
                      </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                     <div className="flex items-start space-x-3">
                        <Checkbox id="overdue" checked={overdue} onCheckedChange={(c) => setOverdue(!!c)} className="mt-1" />
                        <div>
                          <label htmlFor="overdue" className="text-sm font-medium leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Send Overdue Reminders</label>
                          <p className="text-xs text-on-surface-variant mt-1">Automatically send reminders every 3 days if payment is overdue.</p>
                        </div>
                      </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="mt-4 bg-primary hover:bg-primary/90">
                    {isLoading ? "Saving..." : "Save Notifications"}
                  </Button>
                </form>
             </div>
          </TabsContent>

          {/* TAB 5: MY PROFILE */}
          <TabsContent value="profile-me" className="m-0 focus:outline-none">
            <div className="max-w-2xl">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-on-surface">My Profile</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Update your personal information visible to shareholders and the Super Admin.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input value={myName} onChange={e => setMyName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={myPhone} onChange={e => setMyPhone(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Profession</Label>
                    <Input value={myProfession} onChange={e => setMyProfession(e.target.value)} placeholder="e.g. Civil Engineer" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Designation</Label>
                    <Input value={myDesignation} onChange={e => setMyDesignation(e.target.value)} placeholder="e.g. Project Manager" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Organization</Label>
                    <Input value={myOrganization} onChange={e => setMyOrganization(e.target.value)} placeholder="Company or firm name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>WhatsApp No.</Label>
                    <Input value={myWhatsapp} onChange={e => setMyWhatsapp(e.target.value)} placeholder="+880..." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Present Address</Label>
                  <Textarea value={myAddress} onChange={e => setMyAddress(e.target.value)} placeholder="Your current residential or office address" className="h-20" />
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveAdminProfile} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                    {isLoading ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}
