/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppPreloader } from '@/components/loader/pre-loader'
import { SidebarPanel, SidebarPanelMin, Header } from '@/components/layouts'
import { useApp } from '@/context/AppContext'
import '@/styles/sidebar.css'
import { cn } from '@/utils/misc'
import { Outlet, useLoaderData } from '@remix-run/react'
import { BookUser, History, SquareUser, Users2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IMenuItemProps } from '@/components/layouts/sidebar/types'

export function loader() {
  const hostUrl = process.env.HOST_URL
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { hostUrl, apiUrl, nodeEnv }
}

export default function Layout() {
  const { hostUrl, apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const [isExpanded, setIsExpanded] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const { isLoading } = useApp()

  const menuItems: IMenuItemProps[] = useMemo(
    () => [
      {
        title: 'Contacts',
        path: `/contacts`,
        icon: <SquareUser size={18} />,
      },
      {
        title: 'Contact Lists',
        path: `/contact-lists`,
        icon: <BookUser size={18} />,
      },
      {
        title: 'Waiting Lists',
        path: `/waiting-lists`,
        icon: <Users2 size={18} />,
      },
      {
        title: 'Contact Interactions',
        path: `/contact-interactions`,
        icon: <History size={18} />,
      },
    ],
    [],
  )

  const onResize = useCallback(() => {
    if (containerRef.current) {
      if (containerRef.current.offsetWidth <= 1280) {
        setIsExpanded(false)
      }
    }
  }, [])

  useEffect(() => {
    onResize()

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [onResize])

  if (isLoading) {
    // Display loading screen when auth0 isLoading true
    return <AppPreloader className="min-h-screen" />
  }

  return (
    <div
      ref={containerRef}
      className={cn('has-min-sidebar is-header-blur', isExpanded && 'is-sidebar-open')}>
      <div id="root" className="min-h-100vh flex grow">
        <div className="sidebar print:hidden">
          <SidebarPanel menuItems={menuItems} />
          <SidebarPanelMin menuItems={menuItems} />
        </div>

        <Header
          withSidebar
          apiUrl={apiUrl!}
          nodeEnv={nodeEnv}
          hostUrl={hostUrl}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />

        <main className="main-content w-full">
          <div className="mx-auto h-full w-full max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
