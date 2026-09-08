import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import NpmManagement from '../npmManagement'
import { useProjectStore } from '@/store/projectStore'
import { tauriCommands } from '@/lib/tauriUtils'

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

vi.mock('@/lib/tauriUtils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/tauriUtils')>('@/lib/tauriUtils')
  return {
    ...actual,
    tauriCommands: {
      ...actual.tauriCommands,
      checkNpmAvailability: vi.fn(),
      getNpmPackages: vi.fn(),
      getNpmPackageMetadata: vi.fn(),
      initPackageJson: vi.fn(),
      installNpmPackage: vi.fn(),
      cancelNpmInstall: vi.fn(),
    },
  }
})

describe('NpmManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProjectStore.setState({
      selectedProject: null,
      projects: [],
    })
  })

  it('renders "No project selected" when no project is selected', () => {
    render(
      <BrowserRouter>
        <NpmManagement />
      </BrowserRouter>
    )

    expect(screen.getByText('No project selected')).toBeInTheDocument()
    expect(screen.getByText('Back to projects')).toBeInTheDocument()
  })

  it('renders npm status badge and installed packages when a project is selected', async () => {
    useProjectStore.setState({
      selectedProject: {
        name: 'test-app',
        path: '/mock/path/test-app',
        type: 'react',
        createdAt: '2026-01-01',
        pinned: false,
      },
    })

    vi.mocked(tauriCommands.checkNpmAvailability).mockResolvedValue({
      installed: true,
      version: '10.8.0',
      online: true,
      message: 'npm is available',
    })

    vi.mocked(tauriCommands.getNpmPackages).mockResolvedValue([
      { name: 'react', version: '18.3.1', dependencyType: 'production' },
    ])

    render(
      <BrowserRouter>
        <NpmManagement />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('test-app')).toBeInTheDocument()
      expect(screen.getByText('npm 10.8.0')).toBeInTheDocument()
      expect(screen.getByText('Registry Online')).toBeInTheDocument()
      expect(screen.getByText('react')).toBeInTheDocument()
    })
  })

  it('renders missing package.json card and triggers initPackageJson', async () => {
    useProjectStore.setState({
      selectedProject: {
        name: 'empty-project',
        path: '/mock/path/empty-project',
        type: 'react',
        createdAt: '2026-01-01',
        pinned: false,
      },
    })

    vi.mocked(tauriCommands.checkNpmAvailability).mockResolvedValue({
      installed: true,
      version: '10.8.0',
      online: true,
    })

    vi.mocked(tauriCommands.getNpmPackages).mockRejectedValue(
      new Error('package.json not found in project directory')
    )
    vi.mocked(tauriCommands.initPackageJson).mockResolvedValue('Initialized package.json')

    render(
      <BrowserRouter>
        <NpmManagement />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('No package.json found')).toBeInTheDocument()
    })

    const initBtn = screen.getByRole('button', { name: /Initialize package\.json/i })
    fireEvent.click(initBtn)

    await waitFor(() => {
      expect(tauriCommands.initPackageJson).toHaveBeenCalledWith('/mock/path/empty-project')
    })
  })

  it('renders npm missing warning when npm is not installed', async () => {
    useProjectStore.setState({
      selectedProject: {
        name: 'test-app',
        path: '/mock/path/test-app',
        type: 'react',
        createdAt: '2026-01-01',
        pinned: false,
      },
    })

    vi.mocked(tauriCommands.checkNpmAvailability).mockResolvedValue({
      installed: false,
      online: false,
      message: 'npm command not found on system',
    })

    vi.mocked(tauriCommands.getNpmPackages).mockResolvedValue([])

    render(
      <BrowserRouter>
        <NpmManagement />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('npm missing')).toBeInTheDocument()
      expect(screen.getByText('npm command not found')).toBeInTheDocument()
    })
  })
})
