import { ProfileForm } from "@/components/profile/ProfileForm"

export default function ShareholderProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Account Settings</h1>
        <p className="text-on-surface-variant mt-1">Manage your construction profile and contact details.</p>
      </div>
      <ProfileForm />
    </div>
  )
}
