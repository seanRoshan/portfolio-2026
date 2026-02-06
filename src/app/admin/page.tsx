import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "./admin-header"
import { DashboardCards } from "./dashboard-cards"
import type { ContactSubmission } from "@/types/database"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch counts in parallel
  const [projects, skills, experience, blogPosts, unread, recent] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("skills").select("*", { count: "exact", head: true }),
    supabase.from("experience").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
    supabase.from("contact_submissions").select("*", { count: "exact", head: true }).eq("read", false),
    supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(5),
  ])

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="p-4 md:p-6">
        <DashboardCards
          counts={{
            projects: projects.count ?? 0,
            skills: skills.count ?? 0,
            experience: experience.count ?? 0,
            blog_posts: blogPosts.count ?? 0,
            unread_messages: unread.count ?? 0,
          }}
          recentMessages={(recent.data as ContactSubmission[]) ?? []}
        />
      </div>
    </>
  )
}
