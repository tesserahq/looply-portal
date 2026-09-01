/**
 * Segment rule tree types - mirrors the backend's discriminated,
 * depth/size-bounded Pydantic schema (app/schemas/segment_rule.py in the
 * looply API). Not raw/free-form JSON: only these shapes are valid.
 */

export type ListMembershipOp = 'in' | 'not_in'
export type CampaignActivityEvent = 'opened' | 'clicked'
export type CampaignActivityOp = 'has' | 'has_not'
export type LogicalOp = 'and' | 'or'
export type TagMembershipOp = 'in' | 'not_in'

/** Fixed set of Contact columns a contact_field condition can filter on -
 * mirrors the backend's ContactFieldName (app/schemas/segment_rule.py). */
export type ContactFieldName = 'contact_type' | 'company' | 'city' | 'state' | 'country' | 'status'

/** Shared by contact_field and custom_field - mirrors the backend's
 * ContactFieldOp. Which ops are valid for a given field/value_type is
 * enforced by ALLOWED_OPS_BY_CONTACT_FIELD (contact_field, static) or the
 * selected definition's value_type (custom_field, dynamic) - see
 * segment-rule-builder.tsx. */
export type ContactFieldOp = '==' | '!=' | 'ilike' | 'in' | '>' | '>=' | '<' | '<='

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

export type ContactFieldCondition = {
  type: 'contact_field'
  field: ContactFieldName
  operator: ContactFieldOp
  value: string | string[]
}

export type CustomFieldCondition = {
  type: 'custom_field'
  field_name: string
  operator: ContactFieldOp
  value: string | number | boolean
}

/** ANY-of (OR) semantics: `in` means "has at least one of tag_ids", `not_in`
 * means "has none of tag_ids". ALL-of-multiple-tags is expressed by nesting
 * multiple single-tag `in` conditions under an AND group instead. */
export type TagMembershipCondition = {
  type: 'tags'
  tag_ids: string[]
  op: TagMembershipOp
}

export type SegmentLeaf =
  | ListMembershipCondition
  | CampaignActivityCondition
  | ContactFieldCondition
  | CustomFieldCondition
  | TagMembershipCondition

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
