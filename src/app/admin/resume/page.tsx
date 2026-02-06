import { AdminHeader } from "../admin-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileDown } from "lucide-react"

export default function ResumeAdminPage() {
  return (
    <>
      <AdminHeader title="Resume" />
      <div className="p-4 md:p-6 max-w-3xl">
        <Alert>
          <FileDown className="h-4 w-4" />
          <AlertTitle>Coming Soon</AlertTitle>
          <AlertDescription>
            Resume builder will be implemented in Issue #4.
          </AlertDescription>
        </Alert>
      </div>
    </>
  )
}
