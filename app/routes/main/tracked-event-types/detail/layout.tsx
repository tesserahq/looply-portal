import useBreadcrumb from '@/hooks/useBreadcumb'
import { Radio } from 'lucide-react'
import { Outlet, useLoaderData, useLocation, useParams } from 'react-router'
import { DetailItemsProps, Layout, useApp } from 'tessera-ui'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function TrackedEventTypeDetailLayout() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()
  const tracked_event_type_id = params.tracked_event_type_id
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
      path: `/tracked-event-types/${tracked_event_type_id}/overview`,
      icon: Radio as unknown as DetailItemsProps['icon'],
    },
  ]

  return (
    <Layout.Detail
      menuItems={menuItems}
      breadcrumbs={breadcrumbs}
      isLoading={breadcrumbs.length === 0 || !token || !tracked_event_type_id}>
      <div className="max-w-screen-2xl mx-auto">
        <Outlet />
      </div>
    </Layout.Detail>
  )
}
