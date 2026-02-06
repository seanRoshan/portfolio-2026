import { Navigation } from "@/components/Navigation"
import { CustomCursor } from "@/components/CustomCursor"
import { ScrollProgress } from "@/components/ScrollProgress"
import { Footer } from "@/components/sections/Footer"
import { getSiteConfig, getNavLinks } from "@/lib/queries"
import { createClient } from "@/lib/supabase/server"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [siteConfig, navLinks, supabase] = await Promise.all([
    getSiteConfig(),
    getNavLinks(),
    createClient(),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="noise-overlay relative">
      <CustomCursor />
      <ScrollProgress />
      <Navigation navLinks={navLinks} siteConfig={siteConfig} isAuthenticated={!!user} />
      {children}
      <Footer siteConfig={siteConfig} navLinks={navLinks} />
    </div>
  )
}
