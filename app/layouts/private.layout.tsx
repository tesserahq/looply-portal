import { AppPreloader } from '@/components/loader/pre-loader'
import NewResourceShortcut from '@/components/new-resources-shortcut/new-resources-shortcut'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { useRequestInfo } from '@/hooks/useRequestInfo'
import { ROUTE_PATH as THEME_PATH } from '@/routes/resources/update-theme'
import { SITE_CONFIG } from '@/utils/config/site.config'
import { useAuth0 } from '@auth0/auth0-react'
import { BookUser, Contact, FileChartLine, SquareUser, Users2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLoaderData, useLocation, useParams, useSubmit } from 'react-router'
import { Layout, MainItemProps, TesseraProvider } from 'tessera-ui'

export function loader() {
  const identiesApiUrl = process.env.IDENTIES_API_URL

  return {
    identiesApiUrl,
  }
}

export default function PrivateLayout() {
  const { identiesApiUrl } = useLoaderData<typeof loader>()

  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0()
  const [token, setToken] = useState<string>('')
  const handleApiError = useHandleApiError()
  const requestInfo = useRequestInfo()
  const submit = useSubmit()
  const params = useParams()
  const location = useLocation()

  const onSetTheme = (theme: string) => {
    submit(
      { theme },
      {
        method: 'POST',
        action: THEME_PATH,
        navigate: false,
        fetcherKey: 'theme-fetcher',
      }
    )
  }

  const fetchToken = async () => {
    try {
      const token = await getAccessTokenSilently()
      setToken(token)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      handleApiError!(error)
    }
  }

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchToken()
    }
  }, [isLoading, isAuthenticated])

  const menuItems: MainItemProps[] = [
    {
      title: 'Overview',
      path: '/overview',
      icon: FileChartLine,
    },
    {
      title: 'Contacts',
      path: '/contacts',
      icon: SquareUser,
    },
    {
      title: 'Contact Lists',
      path: '/contact-lists',
      icon: BookUser,
    },
    {
      title: 'Waiting Lists',
      path: '/waiting-lists',
      icon: Users2,
    },
    {
      title: 'Contact Interactions',
      path: '/contact-interactions',
      icon: Contact,
    },
  ]

  if (isLoading) {
    return <AppPreloader className="min-h-screen" />
  }

  if (!token || !identiesApiUrl) {
    return <AppPreloader className="min-h-screen" />
  }

  const shouldCollapseSidebar = Boolean(
    location.pathname.includes(`/contacts/${params['contact_id']}/overview`) ||
    location.pathname.includes(`/contact-lists/${params['contact_list_id']}/overview`) ||
    location.pathname.includes(`/waiting-lists/${params['waiting_list_id']}/overview`) ||
    location.pathname.includes(`/contact-interactions/${params['contact_interaction_id']}/overview`)
  )

  return (
    <TesseraProvider identiesApiUrl={identiesApiUrl} token={token}>
      <Layout.Main menuItems={menuItems} collapseSidebar={shouldCollapseSidebar}>
        <Layout.Header
          actionLogout={() => {}}
          actionProfile={() => {}}
          contentRight={<NewResourceShortcut />}
          defaultLogo="/images/logo.png"
          onSetTheme={(theme) => onSetTheme(theme)}
          selectedTheme={requestInfo.userPrefs.theme || 'system'}
          title={SITE_CONFIG.siteTitle}
        />
        <Outlet />
      </Layout.Main>
    </TesseraProvider>
  )
}
