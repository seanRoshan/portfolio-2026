import { AdminHeader } from "../../admin-header"
import { CertificationForm } from "../certification-form"

export default function NewCertificationPage() {
  return (
    <>
      <AdminHeader title="New Certification" />
      <div className="max-w-3xl p-4 md:p-6">
        <CertificationForm />
      </div>
    </>
  )
}
