'use client'

import { type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const location = useLocation()

  return (
    <SidebarGroup className="px-2 py-3">
      <SidebarGroupLabel className="h-7 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
        Core
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              size="default"
              tooltip={item.title}
              isActive={
                location.pathname === item.url ||
                (item.url !== '/' && location.pathname.startsWith(`${item.url}/`))
              }
              className="h-10 px-3 text-sidebar-foreground/75 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
            >
              {item.url.startsWith('/') ? (
                <Link to={item.url}>
                  <item.icon className="h-[18px] w-[18px]" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              ) : (
                <a href={item.url}>
                  <item.icon className="h-[18px] w-[18px]" />
                  <span className="font-medium">{item.title}</span>
                </a>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
