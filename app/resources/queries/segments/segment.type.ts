/**
 * Segment rule tree types - mirrors the backend's discriminated,
 * depth/size-bounded Pydantic schema (app/schemas/segment_rule.py in the
 * looply API). Not raw/free-form JSON: only these shapes are valid.
 */

export type ListMembershipOp = 'in' | 'not_in'
export type CampaignActivityEvent = 'opened' | 'clicked'
export type CampaignActivityOp = 'has' | 'has_not'
export type LogicalOp = 'and' | 'or'

export type ListMembershipCondition = {
  type: 'list_membership'
  list_id: string
  op: ListMembershipOp
}

export type CampaignActivityCondition = {
  type: 'campaign_activity'
  campaign_id: string
  event: CampaignActivityEvent
  op: CampaignActivityOp
}

export type SegmentLeaf = ListMembershipCondition | CampaignActivityCondition

export type SegmentRuleGroup = {
  op: LogicalOp
  conditions: SegmentRuleNode[]
}

/**
 * A node is a RuleGroup if it has `op`+`conditions`, otherwise it's a leaf
 * discriminated by `type` - same convention as the backend schema.
 */
export type SegmentRuleNode = SegmentRuleGroup | SegmentLeaf

export type SegmentRule = {
  root: SegmentRuleNode
}

/**
 * Segment Type
 */
export type SegmentType = {
  id: string
  name: string
  rule: SegmentRule
  created_by_id: string
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a segment
 */
export type CreateSegmentPayload = {
  name: string
  rule: SegmentRule
}

/**
 * Payload for updating a segment
 */
export type UpdateSegmentPayload = Partial<CreateSegmentPayload>

/**
 * Response shape for both preview endpoints (saved and draft segments)
 */
export type SegmentPreviewResponse = {
  contact_count: number
}
