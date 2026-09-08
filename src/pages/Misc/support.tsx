import { Mail, MessageCircleQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Support() {
  const openSupportEmail = () => {
    window.location.href = 'mailto:support@locally.app?subject=Locally support'
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="rounded-3xl border border-border/70 bg-background/90 p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
          <MessageCircleQuestion className="h-6 w-6" />
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.2em] text-muted-foreground">Support</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Get help with Locally</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Report a problem or ask about project creation, cleanup, and workspace management.
        </p>
        <Button className="mt-8" onClick={openSupportEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Contact support
        </Button>
      </div>
    </div>
  )
}

export default Support
