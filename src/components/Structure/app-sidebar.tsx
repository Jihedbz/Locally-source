import * as React from "react"
import {
  GalleryVerticalEnd,
  Settings2,
  Home, FolderDot, Wrench, LifeBuoy, Send,
  Newspaper
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
import { NavSecondary } from "./nav-secondary";

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
  navSecondary: [
    {
      title: "Changelog",
      url: "/changelogs",
      icon: Newspaper,

    },
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ]
  

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />

      </SidebarContent>
      <SidebarFooter>
  <div className="flex items-center justify-between w-full px-2 py-1 text-sm text-muted-foreground">
    
    <ModeToggle />
  </div>
</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
