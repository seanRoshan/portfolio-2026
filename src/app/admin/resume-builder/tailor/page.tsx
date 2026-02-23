import { AdminHeader } from "../../admin-header"
import { getResumes } from "@/lib/resume-builder/queries"
import { TailorClient } from "./tailor-client"

export default async function TailorPage() {
  const resumes = await getResumes()

  return (
    <>
      <AdminHeader title="Resume Tailor" />
      <TailorClient resumes={resumes} />
    </>
  )
}
