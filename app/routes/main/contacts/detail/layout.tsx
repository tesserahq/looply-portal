// import { useApp } from '@/context/AppContext'
import useBreadcrumb from '@/hooks/useBreadcumb'
import { FileChartLine } from 'lucide-react'
import { Outlet, useLoaderData, useLocation, useParams } from 'react-router'
import { DetailItemsProps, Layout, useApp } from 'tessera-ui'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactDetailLayout() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()
  const contact_id = params.contact_id
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
      path: `/contacts/${contact_id}/overview`,
      icon: FileChartLine as unknown as DetailItemsProps['icon'],
    },
  ]

  return (
    <Layout.Detail
      menuItems={menuItems}
      breadcrumbs={breadcrumbs}
      isLoading={breadcrumbs.length === 0 || !token || !contact_id}>
      <div className="max-w-screen-2xl mx-auto">
        <Outlet />
      </div>
    </Layout.Detail>
  )
}
