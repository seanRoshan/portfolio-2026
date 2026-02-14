import { AdminHeader } from '../../admin-header'
import { getJobDescriptions, getResumes } from '@/lib/resume-builder/queries'
import { JDAnalyzerClient } from './jd-analyzer-client'

export default async function JDAnalyzerPage() {
  const [savedAnalyses, resumes] = await Promise.all([
    getJobDescriptions(),
    getResumes(),
  ])

  return (
    <>
      <AdminHeader title="JD Analyzer" />
      <div className="p-4 md:p-6">
        <JDAnalyzerClient savedAnalyses={savedAnalyses} resumes={resumes} />
      </div>
    </>
  )
}
