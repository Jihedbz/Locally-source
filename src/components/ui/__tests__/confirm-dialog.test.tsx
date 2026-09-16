import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from '../confirm-dialog'

describe('ConfirmDialog', () => {
  it('calls onConfirm only after explicit confirmation', () => {
    const onConfirm = vi.fn()

    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Delete project?"
        description="This cannot be undone."
        confirmLabel="Delete project"
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('allows cancelling without confirming', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Remove package?"
        description="Remove this package?"
        confirmLabel="Remove package"
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
