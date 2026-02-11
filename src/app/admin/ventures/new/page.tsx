import { AdminHeader } from "../../admin-header"
import { VentureForm } from "../venture-form"

export default function NewVenturePage() {
  return (
    <>
      <AdminHeader title="New Venture" />
      <div className="max-w-3xl p-4 md:p-6">
        <VentureForm />
      </div>
    </>
  )
}
