import { notFound } from 'next/navigation'
import { AdminHeader } from '../../../admin-header'
import {
  getJobApplication,
  getCoverLetters,
  getResumes,
} from '@/lib/resume-builder/queries'
import { ApplicationDetail } from './application-detail'

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({
  params,
}: ApplicationDetailPageProps) {
  const { id } = await params

  const [application, allCoverLetters, resumes] = await Promise.all([
    getJobApplication(id),
    getCoverLetters(),
    getResumes(),
  ])

  if (!application) {
    notFound()
  }

  const coverLetters = allCoverLetters.filter(
    (cl) => cl.application_id === id
  )

  return (
    <>
      <AdminHeader title="Application Details" />
      <div className="p-4 md:p-6">
        <ApplicationDetail
          application={application}
          coverLetters={coverLetters}
          resumes={resumes}
        />
      </div>
    </>
  )
}
