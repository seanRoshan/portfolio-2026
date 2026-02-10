import { AdminHeader } from "../../admin-header"
import { ProjectForm } from "../project-form"
import {
  getAllExperiences,
  getAllSkills,
  getAllEducation,
  getAllCertifications,
} from "@/lib/queries"

export default async function NewProjectPage() {
  const [experiences, skills, education, certifications] = await Promise.all([
    getAllExperiences(),
    getAllSkills(),
    getAllEducation(),
    getAllCertifications(),
  ])

  return (
    <>
      <AdminHeader title="New Project" />
      <div className="max-w-3xl p-4 md:p-6">
        <ProjectForm
          experiences={experiences}
          skills={skills}
          education={education}
          certifications={certifications}
        />
      </div>
    </>
  )
}
