import { getMonitors } from '@/actions/monitors'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const monitors = await getMonitors()
  return (
    <main>
      <DashboardClient monitors={monitors} />
    </main>
  )
}
