import useBreadcrumb from '@/hooks/useBreadcumb'
import { SlidersHorizontal } from 'lucide-react'
import { Outlet, useLoaderData, useLocation, useParams } from 'react-router'
import { DetailItemsProps, Layout, useApp } from 'tessera-ui'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function CustomFieldDetailLayout() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const params = useParams()
  const definition_id = params.definition_id
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
      path: `/custom-fields/${definition_id}/overview`,
      icon: SlidersHorizontal as unknown as DetailItemsProps['icon'],
    },
  ]

  return (
    <Layout.Detail
      menuItems={menuItems}
      breadcrumbs={breadcrumbs}
      isLoading={breadcrumbs.length === 0 || !token || !definition_id}>
      <div className="max-w-screen-2xl mx-auto">
        <Outlet />
      </div>
    </Layout.Detail>
  )
}
