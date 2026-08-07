import type { Config } from '@react-router/dev/config'
export default {
  ssr: true,
  // Load all routes with the initial HTML document instead of lazily
  // discovering them via runtime `/__manifest` requests. Lazy discovery
  // (the default) fetches a versioned manifest as the user navigates; if a
  // deploy happens between page load and navigation, that fetch can fail
  // repeatedly (a request storm) and leave the app on a blank screen until
  // a manual refresh. See: https://github.com/mylinden-tech/linden-portal/issues/635
  routeDiscovery: { mode: 'initial' },
} satisfies Config
