import NewResourceShortcut from '@/components/new-resources-shortcut/new-resources-shortcut'
import { useRequestInfo } from '@/hooks/useRequestInfo'
import { ROUTE_PATH as THEME_PATH } from '@/routes/resources/update-theme'
import { SITE_CONFIG } from '@/utils/config/site.config'
import { BookUser, Contact, FileChartLine, Megaphone, SquareUser, Users2 } from 'lucide-react'
import { Outlet, useLocation, useNavigate, useParams, useSubmit } from 'react-router'
import { Layout, MainItemProps } from 'tessera-ui'

export default function PrivateLayout() {
  const requestInfo = useRequestInfo()
  const submit = useSubmit()
  const params = useParams()
  const location = useLocation()
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
    {
      title: 'Campaigns',
      path: '/campaigns',
      icon: Megaphone,
    },
  ]

  const shouldCollapseSidebar = Boolean(
    location.pathname.includes(`/contacts/${params['contact_id']}/overview`) ||
    location.pathname.includes(`/contact-lists/${params['contact_list_id']}/overview`) ||
    location.pathname.includes(`/waiting-lists/${params['waiting_list_id']}/overview`) ||
    location.pathname.includes(
      `/contact-interactions/${params['contact_interaction_id']}/overview`
    ) ||
    location.pathname.includes(`/campaigns/${params['campaign_id']}/overview`)
  )

  return (
    <Layout.Main menuItems={menuItems} collapseSidebar={shouldCollapseSidebar}>
      <Layout.Header
        actionLogout={() => navigate('/logout')}
        actionProfile={() => {}}
        contentRight={<NewResourceShortcut />}
        defaultLogo="/images/logo.png"
        onSetTheme={(theme) => onSetTheme(theme)}
        selectedTheme={requestInfo.userPrefs.theme || 'system'}
        title={SITE_CONFIG.siteTitle}
      />
      <Outlet />
    </Layout.Main>
  )
}
