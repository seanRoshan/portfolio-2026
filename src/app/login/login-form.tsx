"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"
import { login, resetPassword } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.input<typeof loginSchema>

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: LoginValues) {
    startTransition(async () => {
      const result = await login(values)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  function onResetPassword() {
    const email = form.getValues("email")
    if (!email) {
      toast.error("Enter your email first")
      return
    }
    startTransition(async () => {
      const result = await resetPassword(email)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Check your email for a reset link")
        setShowReset(false)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="border-border/50 bg-background/50 focus-visible:border-primary/50 focus-visible:bg-background/80 h-11 rounded-xl px-4 text-sm backdrop-blur-sm transition-all"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Password
                </FormLabel>
                {!showReset && (
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-muted-foreground/70 hover:text-primary text-xs transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="border-border/50 bg-background/50 focus-visible:border-primary/50 focus-visible:bg-background/80 h-11 rounded-xl px-4 pr-11 text-sm backdrop-blur-sm transition-all"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground/50 hover:text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reset password inline */}
        {showReset && (
          <div className="border-primary/10 bg-primary/5 rounded-xl border p-3">
            <p className="text-muted-foreground mb-2 text-xs">
              We&apos;ll send a reset link to the email above.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onResetPassword}
                disabled={isPending}
                className="h-8 rounded-lg text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowReset(false)}
                className="text-muted-foreground h-8 rounded-lg text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-xl text-sm font-medium tracking-wide transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
