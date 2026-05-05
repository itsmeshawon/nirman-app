import { ProfileForm } from "@/components/profile/ProfileForm"
import { ManagePassword } from "@/components/profile/ManagePassword"
import { ShareholderPaymentModelCard } from "@/components/profile/ShareholderPaymentModelCard"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export default async function ShareholderProfilePage() {
  let paymentModel = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: shareholderRow } = await getSupabaseAdmin()
        .from("shareholders")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (shareholderRow?.id) {
        const { data: modelRow } = await getSupabaseAdmin()
          .from("shareholder_payment_models")
          .select("*")
          .eq("shareholder_id", shareholderRow.id)
          .maybeSingle()

        paymentModel = modelRow ?? null
      }
    }
  } catch {
    // non-critical — page still renders without payment model
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileForm />
      <ShareholderPaymentModelCard model={paymentModel} />
      <ManagePassword />
    </div>
  )
}
