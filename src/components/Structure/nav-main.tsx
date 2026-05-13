'use client'

import { type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

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
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Core
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild size="sm" className="hover-lift group">
              {item.url.startsWith('/') ? (
                <Link
                  to={item.url}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-accent/50"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              ) : (
                <a
                  href={item.url}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-accent/50"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
