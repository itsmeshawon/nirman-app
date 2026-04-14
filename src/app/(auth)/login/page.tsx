"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !data.user) {
      setError("Invalid email or password. Please try again.")
      setLoading(false)
      return
    }

    // Fetch user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profileError || !profile) {
      setError("Could not load your profile. Please contact support.")
      setLoading(false)
      return
    }

    switch (profile.role) {
      case "SUPER_ADMIN":
        router.push("/dashboard")
        break
      case "PROJECT_ADMIN": {
        const { data: adminRow } = await supabase
          .from("project_admins")
          .select("project_id")
          .eq("user_id", data.user.id)
          .single()
        if (adminRow) {
          router.push(`/${adminRow.project_id}/dashboard`)
        } else {
          router.push("/dashboard")
        }
        break
      }
      case "SHAREHOLDER":
      case "COMMITTEE":
      default:
        router.push("/my/dashboard")
        break
    }
  }

  return (
    <div className="w-full max-w-sm px-6">
      <div className="text-center mb-10">
        <h1 className="text-[36px] font-normal text-[var(--primary)] tracking-tight">NirmaN</h1>
        <p className="text-[14px] text-[var(--on-surface-variant)] mt-2">Construction Transparency Platform</p>
      </div>

      <Card className="rounded-[28px] border border-[var(--surface-variant)] bg-white p-2">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-[24px] font-normal text-[var(--foreground)]">Sign In</CardTitle>
          <CardDescription className="text-[14px] text-[var(--on-surface-variant)]">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[12px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider ml-1">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[12px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider ml-1">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12"
              />
            </div>

            {error && (
              <div className="text-[12px] font-medium text-[var(--destructive)] bg-[var(--error-container)] rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              variant="default"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-[12px] text-center text-[var(--on-surface-variant)] mt-8">
            Don&apos;t have an account? Contact your project admin.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
