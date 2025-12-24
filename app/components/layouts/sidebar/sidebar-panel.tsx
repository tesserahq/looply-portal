import { cn } from '@shadcn/lib/utils'
import { Link, useLocation } from 'react-router'
import { ISidebarPanelProps } from './types'

export function SidebarPanel({ menuItems }: ISidebarPanelProps) {
  const { pathname } = useLocation()

  const isMenuActive = (menuPath: string) => {
    return pathname === menuPath || pathname.startsWith(menuPath + '/')
  }

  return (
    <div
      className="sidebar-panel bg-peat-50 dark:bg-sidebar-background flex h-full grow flex-col
        justify-between bg-white">
      <div className="flex w-full flex-col">
        {/* Sidebar Panel Body */}
        <div className="sidebar-body">
          <div className="is-scrollbar-hidden grow overflow-y-auto">
            <ul className="sidebar-nav mt-2">
              {menuItems.map((item) => (
                <div key={item.path}>
                  <li
                    className={cn(
                      `dark:hover:bg-background flex items-center justify-between overflow-hidden
                      rounded hover:bg-slate-50`,
                      isMenuActive(item.path) && 'bg-accent hover:bg-accent'
                    )}>
                    <Link
                      to={item.path}
                      className={cn('w-full', isMenuActive(item.path) && 'active')}>
                      {item.icon}
                      {item.title}
                    </Link>
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
