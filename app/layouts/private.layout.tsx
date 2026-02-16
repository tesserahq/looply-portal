import { AppPreloader } from '@/components/loader/pre-loader'
import NewResourceShortcut from '@/components/new-resources-shortcut/new-resources-shortcut'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { useRequestInfo } from '@/hooks/useRequestInfo'
import { ROUTE_PATH as THEME_PATH } from '@/routes/resources/update-theme'
import { SITE_CONFIG } from '@/utils/config/site.config'
import { useAuth0 } from '@auth0/auth0-react'
import { BookUser, Contact, FileChartLine, SquareUser, Users2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLoaderData, useNavigate, useSubmit } from 'react-router'
import { Layout, MainItemProps, TesseraProvider } from 'tessera-ui'

export function loader() {
  const identiesApiUrl = process.env.IDENTIES_API_URL

  // app host urls
  const quoreHostUrl = process.env.QUORE_HOST_URL
  const looplyHostUrl = process.env.LOOPLY_HOST_URL || process.env.HOST_URL
  const vaultaHostUrl = process.env.VAULTA_HOST_URL
  const identiesHostUrl = process.env.IDENTIES_HOST_URL
  const orchaHostUrl = process.env.ORCHA_HOST_URL
  const custosHostUrl = process.env.CUSTOS_HOST_URL
  const indexaHostUrl = process.env.INDEXA_HOST_URL
  const sendlyHostUrl = process.env.SENDLY_HOST_URL

  return {
    identiesApiUrl,
    quoreHostUrl,
    looplyHostUrl,
    vaultaHostUrl,
    identiesHostUrl,
    orchaHostUrl,
    custosHostUrl,
    indexaHostUrl,
    sendlyHostUrl,
  }
}

export default function PrivateLayout() {
  const {
    identiesApiUrl,
    quoreHostUrl,
    looplyHostUrl,
    vaultaHostUrl,
    identiesHostUrl,
    orchaHostUrl,
    custosHostUrl,
    indexaHostUrl,
    sendlyHostUrl,
  } = useLoaderData<typeof loader>()

  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0()
  const [token, setToken] = useState<string>('')
  const handleApiError = useHandleApiError()
  const requestInfo = useRequestInfo()
  const submit = useSubmit()
  const navigate = useNavigate()

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

  const appHostUrls = {
    quore: quoreHostUrl ?? '',
    looply: looplyHostUrl ?? '',
    vaulta: vaultaHostUrl ?? '',
    identies: identiesHostUrl ?? '',
    orcha: orchaHostUrl ?? '',
    custos: custosHostUrl ?? '',
    indexa: indexaHostUrl ?? '',
    sendly: sendlyHostUrl ?? '',
  }

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

  return (
    <TesseraProvider identiesApiUrl={identiesApiUrl} token={token}>
      <Layout.Main menuItems={menuItems}>
        <Layout.Header
          appHostUrls={appHostUrls}
          actionLogout={() => navigate('/logout', { replace: true })}
          actionProfile={() => {}}
          defaultAvatar=""
          onSetTheme={(theme) => onSetTheme(theme)}
          selectedTheme={requestInfo.userPrefs.theme || 'system'}
          title={SITE_CONFIG.siteTitle}
          action={<NewResourceShortcut />}
        />
        <Outlet />
      </Layout.Main>
    </TesseraProvider>
  )
}
