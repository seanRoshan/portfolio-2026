"use client"

import { ThemeProvider } from "next-themes"
import { SmoothScroll } from "./SmoothScroll"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <SmoothScroll>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "glass !border-border",
          }}
        />
      </SmoothScroll>
    </ThemeProvider>
  )
}
