import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function MyShareholderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: shareholder } = await supabase
    .from("shareholders")
    .select("project:projects(status)")
    .eq("user_id", user.id)
    .single()

  // If the project is archived, show a blocked message instead of the page content
  if (shareholder?.project && (shareholder.project as any).status === "ARCHIVED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 w-full">
        <div className="max-w-md w-full bg-surface p-8 rounded-[1.25rem] shadow-[0_4px_20px/-4px_rgba(0,0,0,0.05)] border border-outline-variant/30">
          <div className="w-16 h-16 bg-error-container/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-2">Project Archived</h2>
          <p className="text-on-surface-variant mb-0">Communicate with the Project Admin.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
