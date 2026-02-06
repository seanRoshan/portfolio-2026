import { AdminHeader } from "../../admin-header"
import { ProjectForm } from "../project-form"

export default function NewProjectPage() {
  return (
    <>
      <AdminHeader title="New Project" />
      <div className="p-4 md:p-6 max-w-3xl">
        <ProjectForm />
      </div>
    </>
  )
}
