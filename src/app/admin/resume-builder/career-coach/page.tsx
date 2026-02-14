import { AdminHeader } from '../../admin-header'
import { getCoachSessions } from '@/lib/resume-builder/queries'
import { CareerCoachList } from './career-coach-list'

export default async function CareerCoachPage() {
  const sessions = await getCoachSessions()

  return (
    <>
      <AdminHeader title="Career Coach" />
      <div className="p-4 md:p-6">
        <CareerCoachList sessions={sessions} />
      </div>
    </>
  )
}
