import NewResourceShortcut from '@/components/new-resources-shortcut/new-resources-shortcut'
import { useRequestInfo } from '@/hooks/useRequestInfo'
import { ROUTE_PATH as THEME_PATH } from '@/routes/resources/update-theme'
import { SITE_CONFIG } from '@/utils/config/site.config'
import {
  BookUser,
  Contact,
  FileChartLine,
  Filter,
  LucideIcon,
  Megaphone,
  Radio,
  SlidersHorizontal,
  SquareUser,
  Users2,
  Waypoints,
  Zap,
} from 'lucide-react'
import { Outlet, useLocation, useNavigate, useParams, useSubmit } from 'react-router'
import { Layout, MainItemProps } from 'tessera-ui'

// tessera-ui is symlinked from a sibling repo with its own lucide-react/@types/react
// versions, so its LucideIcon type is structurally distinct from this app's — cast
// across that boundary rather than fighting the duplicate types.
const asMenuIcon = (Icon: LucideIcon) => Icon as unknown as MainItemProps['icon']

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
      icon: asMenuIcon(FileChartLine),
    },
    {
      title: 'Contacts',
      path: '/contacts',
      icon: asMenuIcon(SquareUser),
    },
    {
      title: 'Custom Fields',
      path: '/custom-fields',
      icon: asMenuIcon(SlidersHorizontal),
    },
    {
      title: 'Custom Events',
      path: '/custom-events',
      icon: asMenuIcon(Zap),
    },
    {
      title: 'Tracked Event Types',
      path: '/tracked-event-types',
      icon: asMenuIcon(Radio),
    },
    {
      title: 'Event Field Mappings',
      path: '/event-field-mappings',
      icon: asMenuIcon(Waypoints),
    },
    {
      title: 'Contact Lists',
      path: '/contact-lists',
      icon: asMenuIcon(BookUser),
    },
    {
      title: 'Waiting Lists',
      path: '/waiting-lists',
      icon: asMenuIcon(Users2),
    },
    {
      title: 'Contact Interactions',
      path: '/contact-interactions',
      icon: asMenuIcon(Contact),
    },
    {
      title: 'Segments',
      path: '/segments',
      icon: asMenuIcon(Filter),
    },
    {
      title: 'Campaigns',
      path: '/campaigns',
      icon: asMenuIcon(Megaphone),
    },
  ]

  const shouldCollapseSidebar = Boolean(
    location.pathname.includes(`/contacts/${params['contact_id']}/overview`) ||
    location.pathname.includes(`/contact-lists/${params['contact_list_id']}/overview`) ||
    location.pathname.includes(`/waiting-lists/${params['waiting_list_id']}/overview`) ||
    location.pathname.includes(
      `/contact-interactions/${params['contact_interaction_id']}/overview`
    ) ||
    location.pathname.includes(`/segments/${params['segment_id']}/overview`) ||
    location.pathname.includes(`/custom-fields/${params['definition_id']}/overview`) ||
    location.pathname.includes(`/custom-events/${params['event_id']}/overview`) ||
    location.pathname.includes(
      `/tracked-event-types/${params['tracked_event_type_id']}/overview`
    ) ||
    location.pathname.includes(`/event-field-mappings/${params['mapping_id']}/overview`) ||
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
