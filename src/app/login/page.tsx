import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Gradient mesh background — matches Hero */}
      <div className="gradient-mesh absolute inset-0 -z-10" />

      {/* Animated floating orbs */}
      <div className="absolute inset-0 -z-[5] overflow-hidden" aria-hidden="true">
        <div className="login-orb-1 absolute top-[15%] left-[10%] h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.7 0.25 264 / 40%)" }}
        />
        <div className="login-orb-2 absolute right-[10%] bottom-[15%] h-96 w-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "oklch(0.7 0.2 330 / 30%)" }}
        />
        <div className="login-orb-3 absolute top-[50%] left-[50%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.65 0.2 160 / 25%)" }}
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

      {/* Back to site */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to site
      </Link>

      {/* Login card */}
      <div className="relative w-full max-w-[400px]">
        {/* Glow behind card */}
        <div
          className="absolute -inset-px -z-10 rounded-2xl opacity-60 blur-xl"
          style={{ background: "linear-gradient(135deg, oklch(0.7 0.25 264 / 20%), oklch(0.7 0.2 330 / 15%))" }}
          aria-hidden="true"
        />

        <div className="glass rounded-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
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
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h1 className="text-[length:var(--text-xl)] font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your portfolio dashboard
            </p>
          </div>

          <LoginForm />

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground/60">
            Protected area. Authorized access only.
          </p>
        </div>
      </div>
    </div>
  )
}
