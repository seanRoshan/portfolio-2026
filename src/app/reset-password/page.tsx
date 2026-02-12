import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ResetPasswordForm } from "./reset-password-form"

export default async function ResetPasswordPage() {
  // Ensure the user has a valid recovery session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Gradient mesh background — matches Login */}
      <div className="gradient-mesh absolute inset-0 -z-10" />

      {/* Animated floating orbs */}
      <div className="absolute inset-0 -z-[5] overflow-hidden" aria-hidden="true">
        <div
          className="login-orb-1 absolute top-[15%] left-[10%] h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.7 0.25 264 / 40%)" }}
        />
        <div
          className="login-orb-2 absolute right-[10%] bottom-[15%] h-96 w-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "oklch(0.7 0.2 330 / 30%)" }}
        />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(var(--foreground) 1px, transparent 1px),
              linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Noise overlay */}
      <div className="noise-overlay pointer-events-none" />

      {/* Back to login */}
      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground absolute top-6 left-6 z-10 flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      {/* Reset card */}
      <div className="relative w-full max-w-[400px]">
        {/* Glow behind card */}
        <div
          className="absolute -inset-px -z-10 rounded-2xl opacity-60 blur-xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.7 0.25 264 / 20%), oklch(0.7 0.2 330 / 15%))",
          }}
          aria-hidden="true"
        />

        <div className="glass rounded-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-primary/10 ring-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ring-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-[length:var(--text-xl)] font-semibold tracking-tight">
              Set new password
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose a strong password for your account
            </p>
          </div>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}
