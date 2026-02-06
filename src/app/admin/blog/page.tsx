import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { BlogList } from "./blog-list"
import type { BlogPost } from "@/types/database"

export default async function BlogAdminPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <>
      <AdminHeader title="Blog" />
      <div className="p-4 md:p-6 max-w-5xl">
        <BlogList posts={(data as BlogPost[]) ?? []} />
      </div>
    </>
  )
}
