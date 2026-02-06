import { AdminHeader } from "../admin-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText } from "lucide-react"

export default function BlogAdminPage() {
  return (
    <>
      <AdminHeader title="Blog" />
      <div className="p-4 md:p-6 max-w-3xl">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Coming Soon</AlertTitle>
          <AlertDescription>
            Blog management will be implemented in Issue #3.
          </AlertDescription>
        </Alert>
      </div>
    </>
  )
}
