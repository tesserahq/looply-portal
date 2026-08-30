import { SegmentRuleNode } from './segment.type'

/**
 * A default, valid single-leaf rule tree for a brand-new segment or a
 * freshly-added condition.
 */
export function defaultListMembershipLeaf(): SegmentRuleNode {
  return { type: 'list_membership', list_id: '', op: 'in' }
}

/**
 * Count of leaf conditions anywhere in the tree - mirrors the backend's
 * MAX_LEAVES bound (see app/schemas/segment_rule.py in the looply API).
 */
export function countLeaves(node: SegmentRuleNode): number {
  if ('conditions' in node) {
    return node.conditions.reduce((sum, child) => sum + countLeaves(child), 0)
  }
  return 1
}

/**
 * Depth of the tree - a RuleGroup nested inside a RuleGroup counts as +1
 * depth, matching the backend's MAX_TREE_DEPTH measurement.
 */
export function measureDepth(node: SegmentRuleNode): number {
  if ('conditions' in node) {
    return 1 + Math.max(0, ...node.conditions.map(measureDepth))
  }
  return 0
}

/**
 * Whether every leaf in the tree has a real list_id/campaign_id selected -
 * used to avoid firing a preview request (which would 422) against a leaf
 * the user hasn't finished filling in yet.
 */
export function isRuleComplete(node: SegmentRuleNode): boolean {
  if ('conditions' in node) {
    return node.conditions.every(isRuleComplete)
  }
  return node.type === 'list_membership' ? !!node.list_id : !!node.campaign_id
}

/**
 * Short, name-free summary of a rule tree's shape, for list views that don't
 * want to resolve every list_id/campaign_id into a name just to render a row.
 */
export function summarizeSegmentRuleShape(node: SegmentRuleNode): string {
  const leafCount = countLeaves(node)
  if (leafCount === 1) return '1 condition'
  if ('conditions' in node) {
    return `${leafCount} conditions (${node.op.toUpperCase()})`
  }
  return `${leafCount} conditions`
}
