import * as React from 'react'
import { Settings2, Home, FolderDot, Wrench, LifeBuoy, Send, Newspaper } from 'lucide-react'

import { NavMain } from '@/components/Structure/nav-main'
import { TeamSwitcher } from '@/components/Structure/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavSecondary } from './nav-secondary'
import { ModeToggle } from '@/components/ui/modeToggle.tsx'

// This is sample data.
const data = {
  user: {
    name: 'Jihed',
    email: 'Jihed.bouazizi@esprit.tn',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: {
    name: 'Locally',
    logo: 'src-tauri/icons/128x128@2x.png',
    plan: 'Early Alpha',
  },
  navMain: [
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
      url: '/tools',
      icon: Wrench,
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings2,
    },
  ],
  navSecondary: [
    {
      title: 'Changelog',
      url: '/changelogs',
      icon: Newspaper,
    },
    {
      title: 'Support',
      url: '/support',
      icon: LifeBuoy,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-r-0 bg-gradient-to-b from-background to-muted/20"
    >
      <SidebarHeader className="border-b border-border/50 p-4">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="px-2">
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center justify-between w-full">
          <ModeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
