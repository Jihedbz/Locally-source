import { useState, type FormEvent } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAlertStore } from '@/store/alertStore'

export function Feedback() {
  const { show } = useAlertStore()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const submitFeedback = (event: FormEvent) => {
    event.preventDefault()
    if (!message.trim()) {
      show('error', 'Please add feedback before sending')
      return
    }

    const mailto = `mailto:feedback@locally.app?subject=${encodeURIComponent(subject || 'Locally feedback')}&body=${encodeURIComponent(message)}`
    window.location.href = mailto
    show('success', 'Opening your email client...')
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="rounded-3xl border border-border/70 bg-background/90 p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
          <MessageSquare className="h-6 w-6" />
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.2em] text-muted-foreground">Feedback</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Help shape Locally</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Tell us what is useful, what is missing, or where the workflow gets in your way.
        </p>
        <form onSubmit={submitFeedback} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="feedback-subject">Subject</Label>
            <Input
              id="feedback-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="A quick summary"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="feedback-message">Message</Label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What should we know?"
              className="mt-2 flex min-h-32 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>
          <Button type="submit">
            <Send className="mr-2 h-4 w-4" />
            Send feedback
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Feedback
