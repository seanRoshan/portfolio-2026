import { AdminHeader } from "../../admin-header"
import { ProjectForm } from "../project-form"

export default function NewProjectPage() {
  return (
    <>
      <AdminHeader title="New Project" />
      <div className="max-w-3xl p-4 md:p-6">
        <ProjectForm />
      </div>
    </>
  )
}
