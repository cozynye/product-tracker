import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 h-12 flex items-center justify-end">
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              로그아웃
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {children}
      </div>
    </div>
  )
}
