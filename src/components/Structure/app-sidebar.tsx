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

const data = {
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
      url: '/feedback',
      icon: Send,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-r-0 bg-gradient-to-b from-sidebar via-sidebar to-muted/20"
    >
      <SidebarHeader className="border-b border-border/60 p-3 group-data-[collapsible=icon]:p-2">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="px-2 py-3 group-data-[collapsible=icon]:px-1">
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/60 p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex w-full items-center justify-between group-data-[collapsible=icon]:justify-center">
          <ModeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
