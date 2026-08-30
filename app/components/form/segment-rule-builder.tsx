import { NodeENVType } from '@/libraries/fetch'
import { ContactListSelect } from '@/components/form/form-contact-lists'
import { CampaignSelect } from '@/components/form/form-campaigns'
import { defaultListMembershipLeaf } from '@/resources/queries/segments'
import { SegmentLeaf, SegmentRuleNode } from '@/resources/queries/segments/segment.type'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent } from '@shadcn/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn/ui/select'
import { Plus, X } from 'lucide-react'

/** Index path into nested `.conditions` arrays - [] addresses the root. */
type Path = number[]

function getNodeAtPath(root: SegmentRuleNode, path: Path): SegmentRuleNode {
  let node = root
  for (const idx of path) {
    if (!('conditions' in node)) throw new Error('Invalid rule tree path')
    node = node.conditions[idx]
  }
  return node
}

function setNodeAtPath(root: SegmentRuleNode, path: Path, value: SegmentRuleNode): SegmentRuleNode {
  if (path.length === 0) return value
  const [idx, ...rest] = path
  if (!('conditions' in root)) throw new Error('Invalid rule tree path')
  const conditions = root.conditions.slice()
  conditions[idx] = setNodeAtPath(conditions[idx], rest, value)
  return { ...root, conditions }
}

/**
 * Removes the node at `path`. If that leaves its parent group with exactly
 * one remaining condition, the group is collapsed away and replaced by that
 * sole child - a group of one is functionally identical to just the child,
 * and the backend's RuleGroup requires at least one condition anyway.
 */
function removeNodeAtPath(root: SegmentRuleNode, path: Path): SegmentRuleNode {
  const parentPath = path.slice(0, -1)
  const idx = path[path.length - 1]
  const parent = getNodeAtPath(root, parentPath)
  if (!('conditions' in parent)) throw new Error('Invalid rule tree path')
  const newConditions = parent.conditions.filter((_, i) => i !== idx)
  if (newConditions.length === 1) {
    return setNodeAtPath(root, parentPath, newConditions[0])
  }
  return setNodeAtPath(root, parentPath, { ...parent, conditions: newConditions })
}

export interface SegmentRuleBuilderProps {
  root: SegmentRuleNode
  onChange: (root: SegmentRuleNode) => void
  apiUrl: string
  nodeEnv: NodeENVType
  disabled?: boolean
}

export const SegmentRuleBuilder = ({
  root,
  onChange,
  apiUrl,
  nodeEnv,
  disabled = false,
}: SegmentRuleBuilderProps) => {
  const handleNodeChange = (path: Path, value: SegmentRuleNode) => {
    onChange(setNodeAtPath(root, path, value))
  }

  const handleRemove = (path: Path) => {
    onChange(removeNodeAtPath(root, path))
  }

  /** Adds a new leaf as a sibling at `path`, wrapping the root in an AND
   * group first if it's currently a single leaf with nothing to append to. */
  const handleAddCondition = (path: Path) => {
    const node = getNodeAtPath(root, path)
    if ('conditions' in node) {
      onChange(
        setNodeAtPath(root, path, {
          ...node,
          conditions: [...node.conditions, defaultListMembershipLeaf()],
        })
      )
    } else if (path.length === 0) {
      onChange({ op: 'and', conditions: [node, defaultListMembershipLeaf()] })
    }
  }

  const handleAddGroup = (path: Path) => {
    const node = getNodeAtPath(root, path)
    const newGroup: SegmentRuleNode = { op: 'and', conditions: [defaultListMembershipLeaf()] }
    if ('conditions' in node) {
      onChange(setNodeAtPath(root, path, { ...node, conditions: [...node.conditions, newGroup] }))
    } else if (path.length === 0) {
      onChange({ op: 'and', conditions: [node, newGroup] })
    }
  }

  return (
    <div className="space-y-2">
      <RuleNodeEditor
        node={root}
        path={[]}
        onChange={handleNodeChange}
        onRemove={handleRemove}
        onAddCondition={handleAddCondition}
        onAddGroup={handleAddGroup}
        apiUrl={apiUrl}
        nodeEnv={nodeEnv}
        disabled={disabled}
      />
      {/* A group renders its own "Add condition"/"Add group" buttons, but a
       * lone root leaf has nowhere else to render them - a single leaf isn't
       * itself a group, so it can't append siblings to itself. */}
      {!('conditions' in root) && !disabled && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => handleAddCondition([])}>
            <Plus size={14} className="mr-1" />
            Add condition
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => handleAddGroup([])}>
            <Plus size={14} className="mr-1" />
            Add group
          </Button>
        </div>
      )}
    </div>
  )
}

interface RuleNodeEditorProps {
  node: SegmentRuleNode
  path: Path
  onChange: (path: Path, value: SegmentRuleNode) => void
  /** Always defined; a node only renders its own remove button when it isn't
   * the root (path.length > 0) - the root has nothing to fall back to. */
  onRemove: (path: Path) => void
  onAddCondition: (path: Path) => void
  onAddGroup: (path: Path) => void
  apiUrl: string
  nodeEnv: NodeENVType
  disabled: boolean
}

function RuleNodeEditor({
  node,
  path,
  onChange,
  onRemove,
  onAddCondition,
  onAddGroup,
  apiUrl,
  nodeEnv,
  disabled,
}: RuleNodeEditorProps) {
  const isRoot = path.length === 0

  if ('conditions' in node) {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Match</span>
              <Select
                value={node.op}
                disabled={disabled}
                onValueChange={(op: 'and' | 'or') => onChange(path, { ...node, op })}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">ALL (AND)</SelectItem>
                  <SelectItem value="or">ANY (OR)</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">of the following:</span>
            </div>
            {!isRoot && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onRemove(path)}>
                <X size={16} />
              </Button>
            )}
          </div>

          <div className="space-y-2 border-l-2 pl-4">
            {node.conditions.map((child, idx) => (
              <RuleNodeEditor
                key={idx}
                node={child}
                path={[...path, idx]}
                onChange={onChange}
                onRemove={onRemove}
                onAddCondition={onAddCondition}
                onAddGroup={onAddGroup}
                apiUrl={apiUrl}
                nodeEnv={nodeEnv}
                disabled={disabled}
              />
            ))}
          </div>

          {!disabled && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddCondition(path)}>
                <Plus size={14} className="mr-1" />
                Add condition
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onAddGroup(path)}>
                <Plus size={14} className="mr-1" />
                Add group
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <LeafEditor
      node={node}
      path={path}
      isRoot={isRoot}
      onChange={onChange}
      onRemove={onRemove}
      apiUrl={apiUrl}
      nodeEnv={nodeEnv}
      disabled={disabled}
    />
  )
}

interface LeafEditorProps {
  node: SegmentLeaf
  path: Path
  isRoot: boolean
  onChange: (path: Path, value: SegmentRuleNode) => void
  onRemove: (path: Path) => void
  apiUrl: string
  nodeEnv: NodeENVType
  disabled: boolean
}

function LeafEditor({
  node,
  path,
  isRoot,
  onChange,
  onRemove,
  apiUrl,
  nodeEnv,
  disabled,
}: LeafEditorProps) {
  const handleTypeChange = (type: 'list_membership' | 'campaign_activity') => {
    if (type === node.type) return
    onChange(
      path,
      type === 'list_membership'
        ? { type: 'list_membership', list_id: '', op: 'in' }
        : { type: 'campaign_activity', campaign_id: '', event: 'opened', op: 'has_not' }
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
      <Select value={node.type} disabled={disabled} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="list_membership">List membership</SelectItem>
          <SelectItem value="campaign_activity">Campaign activity</SelectItem>
        </SelectContent>
      </Select>

      {node.type === 'list_membership' ? (
        <>
          <Select
            value={node.op}
            disabled={disabled}
            onValueChange={(op: 'in' | 'not_in') => onChange(path, { ...node, op })}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">In</SelectItem>
              <SelectItem value="not_in">Not in</SelectItem>
            </SelectContent>
          </Select>
          <div className="min-w-56 flex-1">
            <ContactListSelect
              value={node.list_id}
              onChange={(list) => onChange(path, { ...node, list_id: list?.id ?? '' })}
              apiUrl={apiUrl}
              nodeEnv={nodeEnv}
              disabled={disabled}
            />
          </div>
        </>
      ) : (
        <>
          <Select
            value={node.op}
            disabled={disabled}
            onValueChange={(op: 'has' | 'has_not') => onChange(path, { ...node, op })}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="has">Has</SelectItem>
              <SelectItem value="has_not">Has not</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={node.event}
            disabled={disabled}
            onValueChange={(event: 'opened' | 'clicked') => onChange(path, { ...node, event })}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="clicked">Clicked</SelectItem>
            </SelectContent>
          </Select>
          <div className="min-w-56 flex-1">
            <CampaignSelect
              value={node.campaign_id}
              onChange={(campaign) => onChange(path, { ...node, campaign_id: campaign?.id ?? '' })}
              apiUrl={apiUrl}
              nodeEnv={nodeEnv}
              disabled={disabled}
            />
          </div>
        </>
      )}

      {!isRoot && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onRemove(path)}>
          <X size={16} />
        </Button>
      )}
    </div>
  )
}
