import { AdminHeader } from "../../admin-header"
import { BlogPostForm } from "../blog-post-form"

export default function NewBlogPostPage() {
  return (
    <>
      <AdminHeader title="New Post" />
      <BlogPostForm />
    </>
  )
}
