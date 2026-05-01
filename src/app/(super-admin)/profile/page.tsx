import { ProfileForm } from "@/components/profile/ProfileForm"
import { ManagePassword } from "@/components/profile/ManagePassword"

export default function SuperAdminProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-4">
        <p className="text-on-surface-variant">Manage your root administrator credentials and system access.</p>
      </div>
      <ProfileForm />
      <ManagePassword />
    </div>
  )
}
