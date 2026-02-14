import { notFound } from 'next/navigation'
import { getResumeWithRelations, getTemplates } from '@/lib/resume-builder/queries'
import { ResumeEditor } from '@/components/resume-builder/editor/ResumeEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResumeEditPage({ params }: Props) {
  const { id } = await params
  const [resume, templates] = await Promise.all([
    getResumeWithRelations(id),
    getTemplates(),
  ])

  if (!resume) notFound()

  return <ResumeEditor resume={resume} templates={templates} />
}
