import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { contactSchema } from "@/lib/schemas/contact"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = contactSchema.parse(body)

    // Use admin client to bypass RLS (public insert policy exists, but admin is more reliable)
    const supabase = createAdminClient()

    const { error } = await supabase.from("contact_submissions").insert(validated)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
