/**
 * Campaign Type
 */
export type CampaignType = {
  id: string
  name: string
  segment_id: string
  project_id: string | null
  template_id: string
  template_variables: Record<string, unknown>
  from_email: string
  subject: string
  tags: string[]
  created_by_id: string
  status: string
  batch_id: string | null
  sent_at: string | null
  completed_at: string | null
  // Result counts, refreshed from Sendly while the campaign is inside its
  // engagement polling window. See engagement_last_synced_at for freshness.
  delivered_count: number
  bounced_count: number
  complained_count: number
  opened_count: number
  clicked_count: number
  // Only advances after a fully successful engagement refresh - null means
  // no successful refresh has happened yet. Use this, not completed_at, to
  // build a "data as of" indicator.
  engagement_last_synced_at: string | null
  // When Looply stops refreshing this campaign's engagement data. Opens or
  // clicks recorded by Sendly after this point are never reflected here.
  engagement_polling_expires_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Computed engagement metrics for a campaign. Not persisted - computed
 * fresh server-side from Campaign's aggregate counts and its recipient
 * snapshot. See docs/prds/0006-campaign-analytics.md in the looply repo.
 */
export type CampaignStatsType = {
  recipient_count: number
  delivered_count: number
  bounced_count: number
  complained_count: number
  opened_count: number
  clicked_count: number
  delivery_rate: number
  bounce_rate: number
  open_rate: number
  click_rate: number
  click_to_open_rate: number
  complaint_rate: number
  engagement_last_synced_at: string | null
}

/**
 * Opens/clicks bucketed by time elapsed since the campaign was sent.
 * opened_at/clicked_at are first-occurrence timestamps only.
 */
export type CampaignEngagementTimelineBucket = {
  label: string
  opened_count: number
  clicked_count: number
}

export type CampaignEngagementTimelineType = {
  buckets: CampaignEngagementTimelineBucket[]
}

/**
 * Payload for creating a campaign
 */
export type CreateCampaignPayload = {
  name: string
  segment_id: string
  project_id?: string
  template_id: string
  from_email: string
  subject: string
  tags?: string[]
  template_variables?: Record<string, unknown>
}

/**
 * Payload for updating a campaign
 */
export type UpdateCampaignPayload = Partial<CreateCampaignPayload>
