import { requireAuth } from "@/lib/admin-auth"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "./admin-sidebar"
import { Toaster } from "@/components/ui/sonner"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  // Fetch unread message count for sidebar badge
  const supabase = await createClient()
  const { count } = await supabase
    .from("contact_submissions")
    .select("*", { count: "exact", head: true })
    .eq("read", false)

  return (
    <div className="min-h-screen bg-background" data-theme="light">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-background">
          <AdminSidebar unreadCount={count ?? 0} />
        </aside>

        {/* Main content */}
        <main className="flex-1 md:pl-64">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
