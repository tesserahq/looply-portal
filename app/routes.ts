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
      route(':contact_id/edit', 'routes/main/contacts/edit.tsx'),
      route(':contact_id', 'routes/main/contacts/detail/layout.tsx', [
        index('routes/main/contacts/detail/index.tsx'),
        route('overview', 'routes/main/contacts/detail/overview.tsx'),
      ]),
    ]),

    // Custom Fields
    route('/custom-fields', 'routes/main/custom-fields/layout.tsx', [
      index('routes/main/custom-fields/index.tsx'),
      route('new', 'routes/main/custom-fields/new.tsx'),
      route(':definition_id/edit', 'routes/main/custom-fields/edit.tsx'),
      route(':definition_id', 'routes/main/custom-fields/detail/layout.tsx', [
        index('routes/main/custom-fields/detail/index.tsx'),
        route('overview', 'routes/main/custom-fields/detail/overview.tsx'),
      ]),
    ]),

    // Custom Events
    route('/custom-events', 'routes/main/custom-events/layout.tsx', [
      index('routes/main/custom-events/index.tsx'),
      route(':event_id', 'routes/main/custom-events/detail/layout.tsx', [
        index('routes/main/custom-events/detail/index.tsx'),
        route('overview', 'routes/main/custom-events/detail/overview.tsx'),
      ]),
    ]),

    // Event Mappings
    route('/event-mappings', 'routes/main/event-mappings/layout.tsx', [
      index('routes/main/event-mappings/index.tsx'),
      route('new', 'routes/main/event-mappings/new.tsx'),
      route(':event_mapping_id/edit', 'routes/main/event-mappings/edit.tsx'),
      route(':event_mapping_id/fields/new', 'routes/main/event-mappings/fields/new.tsx'),
      route(
        ':event_mapping_id/fields/:mapping_id/edit',
        'routes/main/event-mappings/fields/edit.tsx'
      ),
      route(':event_mapping_id', 'routes/main/event-mappings/detail/layout.tsx', [
        index('routes/main/event-mappings/detail/index.tsx'),
        route('overview', 'routes/main/event-mappings/detail/overview.tsx'),
        route('fields', 'routes/main/event-mappings/detail/fields.tsx'),
      ]),
    ]),

    // Contact Lists
    route('/contact-lists', 'routes/main/contact-lists/layout.tsx', [
      index('routes/main/contact-lists/index.tsx'),
      route('new', 'routes/main/contact-lists/new.tsx'),
      route(':contact_list_id/edit', 'routes/main/contact-lists/edit.tsx'),
      route(':contact_list_id', 'routes/main/contact-lists/detail/layout.tsx', [
        index('routes/main/contact-lists/detail/index.tsx'),
        route('overview', 'routes/main/contact-lists/detail/overview.tsx'),
      ]),
    ]),

    // Waiting Lists
    route('/waiting-lists', 'routes/main/waiting-lists/layout.tsx', [
      index('routes/main/waiting-lists/index.tsx'),
      route('new', 'routes/main/waiting-lists/new.tsx'),
      route(':waiting_list_id/edit', 'routes/main/waiting-lists/edit.tsx'),
      route(':waiting_list_id', 'routes/main/waiting-lists/detail/layout.tsx', [
        index('routes/main/waiting-lists/detail/index.tsx'),
        route('overview', 'routes/main/waiting-lists/detail/overview.tsx'),
      ]),
    ]),

    // Contact Interactions
    route('/contact-interactions', 'routes/main/contact-interactions/layout.tsx', [
      index('routes/main/contact-interactions/index.tsx'),
      route('new', 'routes/main/contact-interactions/new.tsx'),
      route(':contact_interaction_id/edit', 'routes/main/contact-interactions/edit.tsx'),
      route(':contact_interaction_id', 'routes/main/contact-interactions/detail/layout.tsx', [
        index('routes/main/contact-interactions/detail/index.tsx'),
        route('overview', 'routes/main/contact-interactions/detail/overview.tsx'),
      ]),
    ]),

    // Segments
    route('/segments', 'routes/main/segments/layout.tsx', [
      index('routes/main/segments/index.tsx'),
      route('new', 'routes/main/segments/new.tsx'),
      route(':segment_id/edit', 'routes/main/segments/edit.tsx'),
      route(':segment_id', 'routes/main/segments/detail/layout.tsx', [
        index('routes/main/segments/detail/index.tsx'),
        route('overview', 'routes/main/segments/detail/overview.tsx'),
      ]),
    ]),

    // Campaigns
    route('/campaigns', 'routes/main/campaigns/layout.tsx', [
      index('routes/main/campaigns/index.tsx'),
      route('new', 'routes/main/campaigns/new.tsx'),
      route(':campaign_id/edit', 'routes/main/campaigns/edit.tsx'),
      route(':campaign_id', 'routes/main/campaigns/detail/layout.tsx', [
        index('routes/main/campaigns/detail/index.tsx'),
        route('overview', 'routes/main/campaigns/detail/overview.tsx'),
        route('audience', 'routes/main/campaigns/detail/audience.tsx'),
      ]),
    ]),
  ]),

  // Logout Route
  route('logout', 'routes/logout.tsx', { id: 'logout' }),

  // Catch-all route for 404 errors - must be last
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
