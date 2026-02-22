import { AdminHeader } from '../../admin-header'
import { getJobApplications, getResumes } from '@/lib/resume-builder/queries'
import { ApplicationsBoard } from './applications-board'

export default async function ApplicationsPage() {
  const [applications, resumes] = await Promise.all([
    getJobApplications(),
    getResumes(),
  ])

  return (
    <>
      <AdminHeader title="Application Tracker" />
      <div className="p-4 md:p-6">
        <ApplicationsBoard applications={applications} resumes={resumes} />
      </div>
    </>
  )
}
