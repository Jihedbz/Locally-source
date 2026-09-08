import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip="Locally workspace"
              className="hover-lift data-[state=open]:bg-accent/50 transition-all duration-200"
            >
              <div className="bg-gradient-to-br from-primary to-accent text-primary-foreground flex aspect-square size-10 items-center justify-center rounded-xl shadow-lg transition-all group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-2">
                  <span className="truncate font-bold gradient-text">Locally</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    Desktop
                  </Badge>
                </div>
                <span className="truncate text-xs text-muted-foreground">Local workspace</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
