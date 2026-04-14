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
    <div className="w-full max-w-sm px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">NirmaN</h1>
        <p className="text-sm text-on-surface-variant mt-1">Construction Transparency Platform</p>
      </div>

      <Card className="shadow-m3-2 border-0 rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="m3-title-large text-on-surface">Sign In</CardTitle>
          <CardDescription className="text-on-surface-variant">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="m3-label-large text-on-surface-variant">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="m3-label-large text-on-surface-variant">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-on-error-container bg-error-container rounded-sm px-3 py-2.5">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-xs text-center text-on-surface-variant mt-5">
            Don&apos;t have an account? Contact your project admin.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
