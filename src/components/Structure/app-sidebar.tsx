import * as React from "react"
import {
  GalleryVerticalEnd,
  Settings2,
  Home, FolderDot, Wrench
} from "lucide-react"
import { ModeToggle } from "@/components/ui/modeToggle";


import { NavMain } from "@/components/Structure/nav-main"
import { TeamSwitcher } from "@/components/Structure/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Jihed",
    email: "Jihed.bouazizi@esprit.tn",
    avatar: "/avatars/shadcn.jpg",
  },
  teams:
    {
      name: "Locally",
      logo: GalleryVerticalEnd,
      plan: "Early Alpha",
    },
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderDot,
    },
    {
      title: "Tools",
      url: "#",
      icon: Wrench,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
  <div className="flex items-center justify-between w-full px-2 py-1 text-sm text-muted-foreground">
    <span>
      Made with <span className="text-red-500">❤️</span> by <strong>Jihed Bouazizi</strong>
    </span>
    <ModeToggle />
  </div>
</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
