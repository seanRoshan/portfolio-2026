import { AdminHeader } from "../../admin-header"
import { ExperienceForm } from "../experience-form"

export default function NewExperiencePage() {
  return (
    <>
      <AdminHeader title="New Experience" />
      <div className="max-w-3xl p-4 md:p-6">
        <ExperienceForm />
      </div>
    </>
  )
}
