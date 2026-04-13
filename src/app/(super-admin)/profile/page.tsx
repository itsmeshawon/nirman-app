import { ProfileForm } from "@/components/profile/ProfileForm"

export default function SuperAdminProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-4">
        <p className="text-gray-500">Manage your root administrator credentials and system access.</p>
      </div>
      <ProfileForm />
    </div>
  )
}
