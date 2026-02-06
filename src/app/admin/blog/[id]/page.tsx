import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../../admin-header"
import { BlogPostForm } from "../blog-post-form"
import type { BlogPost } from "@/types/database"

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("blog_posts").select("*").eq("id", id).single()

  if (!data) notFound()

  return (
    <>
      <AdminHeader title={`Edit: ${data.title}`} />
      <BlogPostForm data={data as BlogPost} />
    </>
  )
}
