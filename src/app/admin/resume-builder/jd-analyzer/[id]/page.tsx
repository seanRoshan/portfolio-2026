import { notFound } from 'next/navigation'
import { AdminHeader } from '../../../admin-header'
import {
  getJobDescription,
  getJobDescriptions,
  getResumes,
} from '@/lib/resume-builder/queries'
import { JDAnalyzerClient } from '../jd-analyzer-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function JDAnalyzerDetailPage({ params }: Props) {
  const { id } = await params
  const [jd, savedAnalyses, resumes] = await Promise.all([
    getJobDescription(id),
    getJobDescriptions(),
    getResumes(),
  ])

  if (!jd) notFound()

  return (
    <>
      <AdminHeader title="JD Analyzer" />
      <div className="p-4 md:p-6">
        <JDAnalyzerClient
          savedAnalyses={savedAnalyses}
          resumes={resumes}
          initialAnalysis={jd}
        />
      </div>
    </>
  )
}
