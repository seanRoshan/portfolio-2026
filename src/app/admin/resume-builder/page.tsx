import { getResumes } from '@/lib/resume-builder/queries'
import { getTemplates } from '@/lib/resume-builder/queries'
import { ResumeList } from './resume-list'

export default async function ResumeBuilderPage() {
  const [resumes, templates] = await Promise.all([
    getResumes(),
    getTemplates(),
  ])

  return (
    <div className="p-4 md:p-6">
      <ResumeList resumes={resumes} templates={templates} />
    </div>
  )
}
