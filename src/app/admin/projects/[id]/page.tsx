import { notFound } from "next/navigation"
import { AdminHeader } from "../../admin-header"
import { ProjectForm } from "../project-form"
import {
  getProjectByIdAdmin,
  getAllExperiences,
  getAllSkills,
  getAllEducation,
  getAllCertifications,
} from "@/lib/queries"
import type { ProjectWithRelations } from "@/types/database"

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, experiences, skills, education, certifications] = await Promise.all([
    getProjectByIdAdmin(id),
    getAllExperiences(),
    getAllSkills(),
    getAllEducation(),
    getAllCertifications(),
  ])

  if (!project) notFound()

  return (
    <>
      <AdminHeader title={`Edit: ${project.title}`} />
      <div className="max-w-3xl p-4 md:p-6">
        <ProjectForm
          data={project as ProjectWithRelations}
          experiences={experiences}
          skills={skills}
          education={education}
          certifications={certifications}
        />
      </div>
    </>
  )
}
