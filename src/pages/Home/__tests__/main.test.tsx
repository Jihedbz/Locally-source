import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '../main'
import { tauriCommands } from '@/lib/tauriUtils'
import { useProjectStore } from '@/store/projectStore'

vi.mock('@/lib/tauriUtils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/tauriUtils')>('@/lib/tauriUtils')
  return {
    ...actual,
    tauriCommands: {
      ...actual.tauriCommands,
      getDirSize: vi.fn(),
    },
  }
})

describe('Home live stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProjectStore.setState({
      projects: [],
      selectedProject: null,
    })
  })

  it('renders live project, disk, framework, and recent-project stats', async () => {
    useProjectStore.setState({
      projects: [
        {
          name: 'react-app',
          path: '/projects/react-app',
          type: 'react',
          createdAt: '2026-01-01',
          pinned: false,
        },
        {
          name: 'next-app',
          path: '/projects/next-app',
          type: 'next',
          createdAt: '2026-02-01',
          pinned: false,
        },
        {
          name: 'another-react-app',
          path: '/projects/another-react-app',
          type: 'react',
          createdAt: '2026-01-15',
          pinned: false,
        },
      ],
    })
    vi.mocked(tauriCommands.getDirSize)
      .mockResolvedValueOnce(1024)
      .mockResolvedValueOnce(2048)
      .mockResolvedValueOnce(1024)

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('4.0 KB')).toBeInTheDocument()
    })
    expect(screen.getByText('react 2 / next 1')).toBeInTheDocument()
    expect(screen.getAllByText('next-app')).toHaveLength(2)
  })
})
