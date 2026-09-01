export type TagType = {
  id: string
  name: string
  created_by_id: string | null
  created_at: string
  updated_at: string
}

/**
 * A tag plus its current contact/campaign assignment counts - what GET /tags
 * returns, so the management list can show usage at a glance.
 */
export type TagWithCountsType = TagType & {
  contacts_count: number
  campaigns_count: number
}

export type TagUsageSegmentType = {
  id: string
  name: string
}

/**
 * A tag's full delete impact: how many contacts/campaigns would lose the
 * tag, and which saved segments would silently stop matching it. Fetched
 * lazily by the delete-confirm dialog, not part of the list.
 */
export type TagUsageType = {
  contacts_count: number
  campaigns_count: number
  segments: TagUsageSegmentType[]
}

export type CreateTagPayload = {
  name: string
}

export type UpdateTagPayload = {
  name: string
}
