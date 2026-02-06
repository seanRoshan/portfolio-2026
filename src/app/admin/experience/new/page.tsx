import { AdminHeader } from "../../admin-header"
import { ExperienceForm } from "../experience-form"

export default function NewExperiencePage() {
  return (
    <>
      <AdminHeader title="New Experience" />
      <div className="p-4 md:p-6 max-w-3xl">
        <ExperienceForm />
      </div>
    </>
  )
}
