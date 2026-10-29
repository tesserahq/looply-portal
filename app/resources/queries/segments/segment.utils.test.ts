import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  countLeaves,
  defaultListMembershipLeaf,
  isRuleComplete,
  measureDepth,
  summarizeSegmentRuleShape,
} from './segment.utils'
import type { SegmentRuleNode } from './segment.type'

describe('segment rule utilities', () => {
  it('creates an incomplete list-membership condition by default', () => {
    const leaf = defaultListMembershipLeaf()

    assert.deepEqual(leaf, { type: 'list_membership', list_id: '', op: 'in' })
    assert.equal(isRuleComplete(leaf), false)
  })

  it('counts leaves and measures nested group depth', () => {
    const tree: SegmentRuleNode = {
      op: 'and',
      conditions: [
        { type: 'list_membership', list_id: 'list-1', op: 'in' },
        {
          op: 'or',
          conditions: [
            { type: 'campaign_activity', campaign_id: 'campaign-1', event: 'opened', op: 'has' },
            { type: 'tags', tag_ids: ['tag-1'], op: 'in' },
          ],
        },
      ],
    }

    assert.equal(countLeaves(tree), 3)
    assert.equal(measureDepth(tree), 2)
    assert.equal(summarizeSegmentRuleShape(tree), '3 conditions (AND)')
  })

  it('requires selected IDs and non-empty tag lists for complete rules', () => {
    assert.equal(
      isRuleComplete({ type: 'campaign_activity', campaign_id: '', event: 'clicked', op: 'has' }),
      false
    )
    assert.equal(isRuleComplete({ type: 'tags', tag_ids: [], op: 'in' }), false)
    assert.equal(isRuleComplete({ type: 'tags', tag_ids: ['tag-1'], op: 'not_in' }), true)
  })

  it('treats false and zero as filled values', () => {
    assert.equal(
      isRuleComplete({ type: 'custom_field', field_name: 'enabled', operator: '==', value: false }),
      true
    )
    assert.equal(
      isRuleComplete({ type: 'custom_field', field_name: 'score', operator: '>', value: 0 }),
      true
    )
  })

  it('summarizes a single condition without resolving names', () => {
    assert.equal(
      summarizeSegmentRuleShape({ type: 'list_membership', list_id: 'list-1', op: 'in' }),
      '1 condition'
    )
  })
})
