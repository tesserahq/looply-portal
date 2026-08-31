// Query functions
export {
  getSegments,
  getSegment,
  createSegment,
  updateSegment,
  deleteSegment,
  previewSegment,
  previewSegmentById,
} from './segment.queries'

// Utils
export {
  defaultListMembershipLeaf,
  countLeaves,
  measureDepth,
  isRuleComplete,
  summarizeSegmentRuleShape,
} from './segment.utils'

// Types
export type {
  SegmentType,
  SegmentRule,
  SegmentRuleNode,
  SegmentRuleGroup,
  SegmentLeaf,
  ListMembershipCondition,
  CampaignActivityCondition,
  ContactFieldCondition,
  CustomFieldCondition,
  ContactFieldName,
  ContactFieldOp,
  ListMembershipOp,
  CampaignActivityEvent,
  CampaignActivityOp,
  LogicalOp,
  CreateSegmentPayload,
  UpdateSegmentPayload,
  SegmentPreviewResponse,
} from './segment.type'
