import { AdminHeader } from "../../admin-header"
import { EducationForm } from "../education-form"

export default function NewEducationPage() {
  return (
    <>
      <AdminHeader title="New Education" />
      <div className="max-w-3xl p-4 md:p-6">
        <EducationForm />
      </div>
    </>
  )
}
