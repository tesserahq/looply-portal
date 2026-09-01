import useBreadcrumb from '@/hooks/useBreadcumb'
import { Waypoints, ListTree } from 'lucide-react'
import { Outlet, useLoaderData, useLocation, useParams } from 'react-router'
import { DetailItemsProps, Layout, useApp } from 'tessera-ui'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function EventMappingDetailLayout() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()
  const event_mapping_id = params.event_mapping_id
  const { pathname } = useLocation()

  const breadcrumbs = useBreadcrumb({
    pathname,
    params,
    token: token || '',
    apiUrl: apiUrl || '',
    nodeEnv,
  })

  const menuItems: DetailItemsProps[] = [
    {
      title: 'Overview',
      path: `/event-mappings/${event_mapping_id}/overview`,
      icon: Waypoints as unknown as DetailItemsProps['icon'],
    },
    {
      title: 'Fields',
      path: `/event-mappings/${event_mapping_id}/fields`,
      icon: ListTree as unknown as DetailItemsProps['icon'],
    },
  ]

  return (
    <Layout.Detail
      menuItems={menuItems}
      breadcrumbs={breadcrumbs}
      isLoading={breadcrumbs.length === 0 || !token || !event_mapping_id}>
      <div className="max-w-screen-2xl mx-auto">
        <Outlet />
      </div>
    </Layout.Detail>
  )
}
