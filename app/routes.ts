import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  // Theme
  route('/resources/update-theme', 'routes/resources/update-theme.ts'),

  // Home Route
  route('/', 'routes/index.tsx'),

  // Private Layout
  layout('layouts/private.layout.tsx', [
    // Overview
    route('/overview', 'routes/main/overview/layout.tsx', [
      index('routes/main/overview/index.tsx'),
    ]),

    // Contacts
    route('/contacts', 'routes/main/contacts/layout.tsx', [
      index('routes/main/contacts/index.tsx'),
      route('new', 'routes/main/contacts/new.tsx'),
      route('imports', 'routes/main/contacts/imports.tsx'),
      route(':id', 'routes/main/contacts/detail.tsx'),
      route(':id/edit', 'routes/main/contacts/edit.tsx'),
    ]),

    // Contact Lists
    route('/contact-lists', 'routes/main/contact-lists/layout.tsx', [
      index('routes/main/contact-lists/index.tsx'),
      route('new', 'routes/main/contact-lists/new.tsx'),
      route(':id', 'routes/main/contact-lists/detail.tsx'),
      route(':id/edit', 'routes/main/contact-lists/edit.tsx'),
    ]),

    // Waiting Lists
    route('/waiting-lists', 'routes/main/waiting-lists/layout.tsx', [
      index('routes/main/waiting-lists/index.tsx'),
      route('new', 'routes/main/waiting-lists/new.tsx'),
      route(':id', 'routes/main/waiting-lists/detail.tsx'),
      route(':id/edit', 'routes/main/waiting-lists/edit.tsx'),
    ]),

    // Contact Interactions
    route('/contact-interactions', 'routes/main/contact-interactions/layout.tsx', [
      index('routes/main/contact-interactions/index.tsx'),
      route('new', 'routes/main/contact-interactions/new.tsx'),
      route(':id', 'routes/main/contact-interactions/detail.tsx'),
      route(':id/edit', 'routes/main/contact-interactions/edit.tsx'),
    ]),
  ]),

  // Logout Route
  route('logout', 'routes/logout.tsx', { id: 'logout' }),

  // Catch-all route for 404 errors - must be last
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
