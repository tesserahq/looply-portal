import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shadcn/ui/tooltip'
import { cn } from '@shadcn/lib/utils'
import { Link, useLocation } from 'react-router'
import { ISidebarPanelProps } from './types'

export function SidebarPanelMin({ menuItems }: ISidebarPanelProps) {
  const { pathname } = useLocation()

  const isMenuActive = (menuPath: string) => {
    return pathname === menuPath || pathname.startsWith(menuPath + '/')
  }

  return (
    <div className="sidebar-panel-min">
      <div className="dark:bg-sidebar-background flex h-full flex-col items-center bg-white">
        {/* Sidebar Panel Min Body */}
        <div className="flex h-[calc(100%-4.5rem)] grow flex-col">
          <div className="is-scrollbar-hidden">
            <ul className={cn('sidebar-nav mt-2 space-y-1')}>
              {menuItems.map((item) => (
                <div key={item.title}>
                  <li className="overflow-hidden rounded">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.path}
                            className={cn('', isMenuActive(item.path) && 'active')}>
                            {item.icon}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </li>

                  {item.divider && (
                    <hr className="my-2 border-t border-slate-200 dark:border-slate-700" />
                  )}
                </div>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
