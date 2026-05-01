import { ProfileForm } from "@/components/profile/ProfileForm"
import { ManagePassword } from "@/components/profile/ManagePassword"

export default function ShareholderProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileForm />
      <ManagePassword />
    </div>
  )
}
