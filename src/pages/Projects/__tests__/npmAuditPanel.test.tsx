import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import NpmAuditPanel from '../npmAuditPanel'
import { tauriCommands, NpmAuditReport } from '@/lib/tauriUtils'

vi.mock('@/lib/tauriUtils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/tauriUtils')>('@/lib/tauriUtils')
  return {
    ...actual,
    tauriCommands: {
      ...actual.tauriCommands,
      auditNpmPackages: vi.fn(),
      fixNpmAudit: vi.fn(),
    },
  }
})

const mockZeroVulnReport: NpmAuditReport = {
  summary: {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: 0,
    totalDependencies: 42,
  },
  vulnerabilities: [],
}

const mockVulnReport: NpmAuditReport = {
  summary: {
    info: 0,
    low: 1,
    moderate: 0,
    high: 1,
    critical: 1,
    total: 3,
    totalDependencies: 120,
  },
  vulnerabilities: [
    {
      name: 'axios',
      severity: 'critical',
      isDirect: true,
      range: '<0.21.2',
      effects: [],
      via: ['axios'],
      fixAvailable: {
        name: 'axios',
        version: '1.7.0',
        isSemVerMajor: true,
      },
      advisories: [
        {
          name: 'axios',
          title: 'Server-Side Request Forgery in axios',
          url: 'https://github.com/advisories/GHSA-cph5-5pLy-mm95',
          severity: 'critical',
          range: '<0.21.2',
          cwe: ['CWE-918'],
        },
      ],
    },
    {
      name: 'semver',
      severity: 'high',
      isDirect: false,
      range: '>=7.0.0 <7.5.2',
      effects: ['@babel/core'],
      via: ['semver'],
      fixAvailable: {
        name: '@babel/core',
        version: '7.23.0',
        isSemVerMajor: false,
      },
      advisories: [
        {
          name: 'semver',
          title: 'ReDoS vulnerability in semver',
          url: 'https://github.com/advisories/GHSA-c2qf-rxjj-qqgw',
          severity: 'high',
          range: '>=7.0.0 <7.5.2',
          cwe: ['CWE-1333'],
        },
      ],
    },
    {
      name: 'debug',
      severity: 'low',
      isDirect: false,
      range: '<2.6.9',
      effects: ['express'],
      via: ['debug'],
      fixAvailable: undefined,
      advisories: [
        {
          name: 'debug',
          title: 'ReDoS in debug',
          url: 'https://github.com/advisories/GHSA-g65x-44x3-6d5c',
          severity: 'low',
          range: '<2.6.9',
          cwe: ['CWE-400'],
        },
      ],
    },
  ],
}

describe('NpmAuditPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders zero vulnerabilities state when no issues exist', async () => {
    vi.mocked(tauriCommands.auditNpmPackages).mockResolvedValue(mockZeroVulnReport)

    render(<NpmAuditPanel projectPath="/mock/project" projectName="secure-app" />)

    expect(screen.getByText('Scanning...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Zero Vulnerabilities Detected')).toBeInTheDocument()
    })

    expect(
      screen.getByText(/All 42 scanned packages in secure-app pass npm security checks/i)
    ).toBeInTheDocument()
  })

  it('renders vulnerability metrics and lists when vulnerabilities exist', async () => {
    vi.mocked(tauriCommands.auditNpmPackages).mockResolvedValue(mockVulnReport)

    render(<NpmAuditPanel projectPath="/mock/project" projectName="vulnerable-app" />)

    await waitFor(() => {
      expect(screen.getByText('axios')).toBeInTheDocument()
    })

    expect(screen.getByText('semver')).toBeInTheDocument()
    expect(screen.getByText('debug')).toBeInTheDocument()
    expect(screen.getByText('Total Issues')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('filters vulnerabilities by search query', async () => {
    vi.mocked(tauriCommands.auditNpmPackages).mockResolvedValue(mockVulnReport)

    render(<NpmAuditPanel projectPath="/mock/project" projectName="vulnerable-app" />)

    await waitFor(() => {
      expect(screen.getByText('axios')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Filter by package or advisory...')
    fireEvent.change(searchInput, { target: { value: 'axios' } })

    expect(screen.getByText('axios')).toBeInTheDocument()
    expect(screen.queryByText('semver')).not.toBeInTheDocument()
    expect(screen.queryByText('debug')).not.toBeInTheDocument()
  })

  it('triggers fix audit when Fix Vulnerabilities button is clicked', async () => {
    vi.mocked(tauriCommands.auditNpmPackages).mockResolvedValue(mockVulnReport)
    vi.mocked(tauriCommands.fixNpmAudit).mockResolvedValue('Fixed 1 vulnerability')

    const onFixStart = vi.fn()
    const onFixEnd = vi.fn()

    render(
      <NpmAuditPanel
        projectPath="/mock/project"
        projectName="vulnerable-app"
        onFixStart={onFixStart}
        onFixEnd={onFixEnd}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Fix Vulnerabilities')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Fix Vulnerabilities'))

    await waitFor(() => {
      expect(tauriCommands.fixNpmAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/mock/project',
          force: false,
        })
      )
    })

    expect(onFixStart).toHaveBeenCalled()
    expect(onFixEnd).toHaveBeenCalled()
  })
})
