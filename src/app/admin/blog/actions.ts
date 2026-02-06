"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { blogSchema, type BlogFormValues } from "@/lib/schemas/blog"

export async function createBlogPost(data: BlogFormValues) {
  await requireAuth()
  const validated = blogSchema.parse(data)
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert(validated)
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidateTag("blog", "max")
  revalidatePath("/")
  return { success: true, id: post.id }
}

export async function updateBlogPost(id: string, data: BlogFormValues) {
  await requireAuth()
  const validated = blogSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from("blog_posts").update(validated).eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("blog", "max")
  revalidatePath("/")
  return { success: true }
}

export async function deleteBlogPost(id: string) {
  await requireAuth()
  const supabase = await createClient()

  // Clean up storage images for this post
  const { data: files } = await supabase.storage.from("blog").list(id)
  if (files && files.length > 0) {
    await supabase.storage.from("blog").remove(files.map((f) => `${id}/${f.name}`))
  }

  const { error } = await supabase.from("blog_posts").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("blog", "max")
  revalidatePath("/")
  return { success: true }
}

export async function duplicateBlogPost(id: string) {
  await requireAuth()
  const supabase = await createClient()

  const { data: original, error: fetchError } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !original) return { error: fetchError?.message ?? "Post not found" }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = original
  const { data: copy, error } = await supabase
    .from("blog_posts")
    .insert({
      ...rest,
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      published: false,
      published_at: null,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidateTag("blog", "max")
  return { success: true, id: copy.id }
}

export async function checkSlugUnique(slug: string, excludeId?: string) {
  await requireAuth()
  const supabase = await createClient()

  let query = supabase.from("blog_posts").select("id").eq("slug", slug)
  if (excludeId) query = query.neq("id", excludeId)

  const { data } = await query
  return { unique: !data || data.length === 0 }
}
