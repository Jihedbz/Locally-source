import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { NavMain } from '../nav-main'
import { Home, FolderDot, Wrench, Settings2 } from 'lucide-react'

// Mock the sidebar components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <button>{children}</button>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockItems = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Projects',
    url: '/projects',
    icon: FolderDot,
  },
  {
    title: 'Tools',
    url: '#',
    icon: Wrench,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2,
  },
]

describe('NavMain', () => {
  it('renders navigation items with correct links', () => {
    render(
      <BrowserRouter>
        <NavMain items={mockItems} />
      </BrowserRouter>
    )

    // Check that route-based links use React Router Link
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveAttribute('href', '/')

    const projectsLink = screen.getByText('Projects').closest('a')
    expect(projectsLink).toHaveAttribute('href', '/projects')

    const settingsLink = screen.getByText('Settings').closest('a')
    expect(settingsLink).toHaveAttribute('href', '/settings')

    // Check that hash links use regular anchor tags
    const toolsLink = screen.getByText('Tools').closest('a')
    expect(toolsLink).toHaveAttribute('href', '#')
  })

  it('renders all navigation items', () => {
    render(
      <BrowserRouter>
        <NavMain items={mockItems} />
      </BrowserRouter>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})
