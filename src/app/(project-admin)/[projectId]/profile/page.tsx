import { ProfileForm } from "@/components/profile/ProfileForm"

export default function ProjectAdminProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-4">
        {/* The title is handled by the Shell's topbar, but we can add a subtitle here if needed */}
        <p className="text-on-surface-variant">Manage your administrative profile and platform settings.</p>
      </div>
      <ProfileForm />
    </div>
  )
}
