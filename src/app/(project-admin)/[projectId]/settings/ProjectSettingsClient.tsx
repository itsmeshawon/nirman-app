"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Banknote, CalendarClock, Bell, LayoutGrid } from "lucide-react"
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

interface ProjectSettingsClientProps {
  projectId: string
  project: any
  paymentSchedule: any
  penaltyConfig: any
  notificationConfig: any
}

export function ProjectSettingsClient({
  projectId,
  project,
  paymentSchedule,
  penaltyConfig,
  notificationConfig,
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
      if (!res.ok) throw new Error("Failed to save penalty config")
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

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Project Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure project rules, schedules, and automated communications.</p>
      </div>

      <Tabs defaultValue="profile" className="flex flex-col md:flex-row">
        <div className="md:w-64 bg-gray-50 border-r border-gray-200">
          <TabsList className="flex flex-col h-auto bg-transparent p-2 space-y-1 w-full m-0 items-stretch">
            <TabsTrigger 
              value="profile" 
              className="justify-start gap-2 px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-[#0F766E] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"
            >
              <Building className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger 
              value="payment" 
              className="justify-start gap-2 px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-[#0F766E] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"
            >
              <Banknote className="h-4 w-4" /> Payment Model
            </TabsTrigger>
            <TabsTrigger 
              value="penalties" 
              className="justify-start gap-2 px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-[#0F766E] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"
            >
              <CalendarClock className="h-4 w-4" /> Penalties
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="justify-start gap-2 px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-[#0F766E] data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200"
            >
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 p-6 md:p-8">
          
          {/* TAB 1: PROFILE */}
          <TabsContent value="profile" className="m-0 focus:outline-none">
             <div className="max-w-2xl">
                <div className="mb-6 pb-6 border-b border-gray-100 flex items-center gap-4">
                  <div className="p-3 bg-teal-100/50 rounded-xl">
                    <LayoutGrid className="w-8 h-8 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Project Details</h3>
                    <p className="text-sm text-gray-500">ID: {projectId.slice(0,8)}... • Created {new Date(project.created_at).toLocaleDateString()}</p>
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
                  <Button type="submit" disabled={isLoading} className="mt-4 bg-[#0F766E] hover:bg-teal-800">
                    {isLoading ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
             </div>
          </TabsContent>

          {/* TAB 2: PAYMENT MODEL */}
          <TabsContent value="payment" className="m-0 focus:outline-none">
             <div className="max-w-2xl">
               <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Payment Collection Model</h3>
                <p className="text-sm text-gray-500 mt-1">Determine how shareholders are billed for the project cost.</p>
               </div>

                <form onSubmit={handleSavePaymentModel} className="space-y-6 border-b pb-6">
                  <div className="grid gap-2">
                    <Label>Model Type</Label>
                    <Select value={paymentType} onValueChange={setPaymentType}>
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
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
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
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                      Note: Milestone amounts will be configured directly on the Milestones page once enabled.
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading} className="mt-4 bg-[#0F766E] hover:bg-teal-800">
                    {isLoading ? "Saving Setup..." : "Save Setup"}
                  </Button>
                </form>

                <div className="pt-6">
                   <h4 className="text-sm font-medium text-gray-900 mb-2">Schedule Generation</h4>
                   <p className="text-sm text-gray-500 mb-4">Run the engine to generate upcoming invoices based on current active shareholders and rules.</p>
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
                <h3 className="text-lg font-medium text-gray-900">Late Payment Penalties</h3>
                <p className="text-sm text-gray-500 mt-1">Configure automated late fees for overdue payments.</p>
               </div>

                <form onSubmit={handleSavePenalties} className="space-y-6">
                  
                  <div className="grid gap-2">
                    <Label htmlFor="grace_days">Grace Period (Days)</Label>
                    <Input id="grace_days" type="number" min="0" value={graceDays} onChange={(e) => setGraceDays(e.target.value)} placeholder="e.g. 5" className="max-w-[200px]" />
                    <p className="text-xs text-gray-500">Number of days after due date before penalties apply.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Penalty Type</Label>
                    <Select value={penaltyType} onValueChange={setPenaltyType}>
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
                    <div className="grid gap-2 bg-gray-50 p-4 rounded border">
                       <Label htmlFor="fixed_amount">Fixed Penalty Amount (৳)</Label>
                       <Input id="fixed_amount" type="number" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} className="max-w-[200px]" />
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading} className="mt-4 bg-[#0F766E] hover:bg-teal-800">
                    {isLoading ? "Saving..." : "Save Penalty Config"}
                  </Button>
                </form>
             </div>
          </TabsContent>

          {/* TAB 4: NOTIFICATIONS */}
          <TabsContent value="notifications" className="m-0 focus:outline-none">
             <div className="max-w-2xl">
               <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Automated Reminders</h3>
                <p className="text-sm text-gray-500 mt-1">Configure when system sends payment reminders to shareholders.</p>
               </div>

                <form onSubmit={handleSaveNotifications} className="space-y-6">
                  
                  <div className="space-y-3">
                     <Label className="text-base">Pre-Due Reminders</Label>
                     <p className="text-sm text-gray-500 mb-3">Send emails X days before payment is due:</p>
                     
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
                          <p className="text-xs text-gray-500 mt-1">Automatically send reminders every 3 days if payment is overdue.</p>
                        </div>
                      </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="mt-4 bg-[#0F766E] hover:bg-teal-800">
                    {isLoading ? "Saving..." : "Save Notifications"}
                  </Button>
                </form>
             </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}
