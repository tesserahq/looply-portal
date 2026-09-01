import { NodeENVType } from '@/libraries/fetch'
import { ContactListSelect } from '@/components/form/form-contact-lists'
import { CampaignSelect } from '@/components/form/form-campaigns'
import { TagMultiSelect } from '@/components/form/form-tags'
import { defaultListMembershipLeaf } from '@/resources/queries/segments'
import {
  ContactFieldCondition,
  ContactFieldName,
  ContactFieldOp,
  CustomFieldCondition,
  SegmentLeaf,
  SegmentRuleNode,
} from '@/resources/queries/segments/segment.type'
import { FieldValueType } from '@/resources/queries/custom-fields'
import { useContactTypes, useContactStatuses } from '@/resources/hooks/contacts'
import { useCustomFieldDefinitions } from '@/resources/hooks/custom-fields/use-custom-field'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent } from '@shadcn/ui/card'
import { Input } from '@shadcn/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn/ui/select'
import { Plus, X } from 'lucide-react'
import { useApp } from 'tessera-ui'

/** Mirrors the backend's ALLOWED_OPS_BY_FIELD (app/schemas/segment_rule.py) -
 * none of contact_field's own columns are numeric/ordered, so none of them
 * ever grant >, >=, <, <=. */
const STRING_FIELD_OPS: ContactFieldOp[] = ['==', '!=', 'ilike', 'in']
/** status is a fixed enum (active/inactive/pending), not free text - ilike
 * doesn't apply, but in is genuinely useful (e.g. "active or pending"). */
const STATUS_FIELD_OPS: ContactFieldOp[] = ['==', '!=', 'in']
const ALLOWED_OPS_BY_CONTACT_FIELD: Record<ContactFieldName, ContactFieldOp[]> = {
  contact_type: STRING_FIELD_OPS,
  company: STRING_FIELD_OPS,
  city: STRING_FIELD_OPS,
  state: STRING_FIELD_OPS,
  country: STRING_FIELD_OPS,
  status: STATUS_FIELD_OPS,
}

const CONTACT_FIELD_LABELS: Record<ContactFieldName, string> = {
  contact_type: 'Contact type',
  company: 'Company',
  city: 'City',
  state: 'State',
  country: 'Country',
  status: 'Status',
}

/** Mirrors the backend's ALLOWED_OPS_BY_VALUE_TYPE
 * (app/repositories/segment_resolver.py) MINUS "in" - unlike contact_field,
 * CustomFieldCondition.value (app/schemas/segment_rule.py) has no list
 * variant, so "in" has no value shape that would actually validate; it's
 * left off here rather than offered and always rejected. */
const ALLOWED_OPS_BY_VALUE_TYPE: Record<FieldValueType, ContactFieldOp[]> = {
  string: ['==', '!=', 'ilike'],
  number: ['==', '!=', '>', '>=', '<', '<='],
  boolean: ['==', '!='],
  date: ['==', '!=', '>', '>=', '<', '<='],
}

const OP_LABELS: Record<ContactFieldOp, string> = {
  '==': 'Is',
  '!=': 'Is not',
  ilike: 'Contains',
  in: 'Is any of',
  '>': '>',
  '>=': '>=',
  '<': '<',
  '<=': '<=',
}

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
  const handleTypeChange = (type: SegmentLeaf['type']) => {
    if (type === node.type) return
    let next: SegmentLeaf
    switch (type) {
      case 'list_membership':
        next = { type: 'list_membership', list_id: '', op: 'in' }
        break
      case 'campaign_activity':
        next = { type: 'campaign_activity', campaign_id: '', event: 'opened', op: 'has_not' }
        break
      case 'contact_field':
        next = { type: 'contact_field', field: 'company', operator: '==', value: '' }
        break
      case 'custom_field':
        next = { type: 'custom_field', field_name: '', operator: '==', value: '' }
        break
      case 'tags':
        next = { type: 'tags', tag_ids: [], op: 'in' }
        break
    }
    onChange(path, next)
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
          <SelectItem value="contact_field">Contact field</SelectItem>
          <SelectItem value="custom_field">Custom field</SelectItem>
          <SelectItem value="tags">Tags</SelectItem>
        </SelectContent>
      </Select>

      {node.type === 'tags' ? (
        <>
          <Select
            value={node.op}
            disabled={disabled}
            onValueChange={(op: 'in' | 'not_in') => onChange(path, { ...node, op })}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">Has any of</SelectItem>
              <SelectItem value="not_in">Has none of</SelectItem>
            </SelectContent>
          </Select>
          <div className="min-w-56 flex-1">
            <TagMultiSelect
              value={node.tag_ids}
              onChange={(tagIds) => onChange(path, { ...node, tag_ids: tagIds })}
              apiUrl={apiUrl}
              nodeEnv={nodeEnv}
              disabled={disabled}
            />
          </div>
        </>
      ) : node.type === 'list_membership' ? (
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
      ) : node.type === 'campaign_activity' ? (
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
      ) : node.type === 'contact_field' ? (
        <ContactFieldEditor
          node={node}
          onChange={(value) => onChange(path, value)}
          apiUrl={apiUrl}
          nodeEnv={nodeEnv}
          disabled={disabled}
        />
      ) : (
        <CustomFieldEditor
          node={node}
          onChange={(value) => onChange(path, value)}
          apiUrl={apiUrl}
          nodeEnv={nodeEnv}
          disabled={disabled}
        />
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

interface ContactFieldEditorProps {
  node: ContactFieldCondition
  onChange: (value: ContactFieldCondition) => void
  apiUrl: string
  nodeEnv: NodeENVType
  disabled: boolean
}

/** field/operator/value editor for a `contact_field` leaf - field and its
 * allowed operators are a static, fixed set (ALLOWED_OPS_BY_CONTACT_FIELD),
 * so unlike custom_field this needs no lookup to know what's valid. */
function ContactFieldEditor({
  node,
  onChange,
  apiUrl,
  nodeEnv,
  disabled,
}: ContactFieldEditorProps) {
  const { token } = useApp()
  const allowedOps = ALLOWED_OPS_BY_CONTACT_FIELD[node.field]
  const { data: contactTypes, isLoading: isLoadingContactTypes } = useContactTypes({
    apiUrl,
    token: token!,
    nodeEnv,
  })
  const { data: contactStatuses, isLoading: isLoadingContactStatuses } = useContactStatuses({
    apiUrl,
    token: token!,
    nodeEnv,
  })

  const handleFieldChange = (field: ContactFieldName) => {
    const operator = ALLOWED_OPS_BY_CONTACT_FIELD[field].includes(node.operator)
      ? node.operator
      : ALLOWED_OPS_BY_CONTACT_FIELD[field][0]
    const value = field === 'status' ? 'active' : operator === 'in' ? [] : ''
    onChange({ ...node, field, operator, value })
  }

  const handleOperatorChange = (operator: ContactFieldOp) => {
    let value: ContactFieldCondition['value']
    if (operator === 'in') {
      value = Array.isArray(node.value) ? node.value : node.value ? [node.value as string] : []
    } else {
      value = Array.isArray(node.value) ? (node.value[0] ?? '') : node.value
    }
    onChange({ ...node, operator, value })
  }

  return (
    <>
      <Select value={node.field} disabled={disabled} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(CONTACT_FIELD_LABELS).map(([field, label]) => (
            <SelectItem key={field} value={field}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={node.operator} disabled={disabled} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowedOps.map((op) => (
            <SelectItem key={op} value={op}>
              {OP_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="min-w-56 flex-1">
        {node.field === 'status' ? (
          <Select
            value={node.operator === 'in' ? undefined : (node.value as string)}
            disabled={disabled || isLoadingContactStatuses}
            onValueChange={(value) =>
              onChange({
                ...node,
                value:
                  node.operator === 'in'
                    ? [...new Set([...(node.value as string[]), value])]
                    : value,
              })
            }>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {contactStatuses?.items.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : node.field === 'contact_type' ? (
          <Select
            value={node.operator === 'in' ? undefined : (node.value as string)}
            disabled={disabled || isLoadingContactTypes}
            onValueChange={(value) =>
              onChange({
                ...node,
                value:
                  node.operator === 'in'
                    ? [...new Set([...(node.value as string[]), value])]
                    : value,
              })
            }>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a contact type" />
            </SelectTrigger>
            <SelectContent>
              {contactTypes?.items.map((opt) => (
                <SelectItem key={opt.id} value={opt.name}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : node.operator === 'in' ? (
          <Input
            value={(node.value as string[]).join(', ')}
            disabled={disabled}
            placeholder="Comma-separated values"
            onChange={(e) =>
              onChange({
                ...node,
                value: e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        ) : (
          <Input
            value={node.value as string}
            disabled={disabled}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
          />
        )}
      </div>
    </>
  )
}

interface CustomFieldEditorProps {
  node: CustomFieldCondition
  onChange: (value: CustomFieldCondition) => void
  apiUrl: string
  nodeEnv: NodeENVType
  disabled: boolean
}

/** field_name/operator/value editor for a `custom_field` leaf - field_name is
 * a free-form string on a CustomFieldDefinition row, so (unlike
 * contact_field) its allowed operators and value shape depend on a lookup
 * into that row's value_type, done here client-side against the same
 * definitions list the picker below is populated from. */
function CustomFieldEditor({ node, onChange, apiUrl, nodeEnv, disabled }: CustomFieldEditorProps) {
  const { token } = useApp()
  const { data: definitions, isLoading: isLoadingDefinitions } = useCustomFieldDefinitions(
    { apiUrl, token: token!, nodeEnv },
    { page: 1, size: 100 }
  )

  const selectedDefinition = definitions?.items.find((d) => d.name === node.field_name)
  const valueType = selectedDefinition?.value_type
  const allowedOps = valueType
    ? ALLOWED_OPS_BY_VALUE_TYPE[valueType]
    : STRING_FIELD_OPS.filter((op) => op !== 'in')

  const handleFieldNameChange = (field_name: string) => {
    const definition = definitions?.items.find((d) => d.name === field_name)
    const nextAllowedOps = definition
      ? ALLOWED_OPS_BY_VALUE_TYPE[definition.value_type]
      : allowedOps
    const operator = nextAllowedOps.includes(node.operator) ? node.operator : nextAllowedOps[0]
    const value = definition?.value_type === 'boolean' ? false : ''
    onChange({ ...node, field_name, operator, value })
  }

  const handleOperatorChange = (operator: ContactFieldOp) => {
    onChange({ ...node, operator })
  }

  return (
    <>
      <Select
        value={node.field_name}
        disabled={disabled || isLoadingDefinitions}
        onValueChange={handleFieldNameChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select a field" />
        </SelectTrigger>
        <SelectContent>
          {definitions?.items.map((definition) => (
            <SelectItem key={definition.id} value={definition.name}>
              {definition.label || definition.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={node.operator} disabled={disabled} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowedOps.map((op) => (
            <SelectItem key={op} value={op}>
              {OP_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="min-w-56 flex-1">
        {valueType === 'boolean' ? (
          <Select
            value={String(node.value)}
            disabled={disabled}
            onValueChange={(value) => onChange({ ...node, value: value === 'true' })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        ) : valueType === 'number' ? (
          <Input
            type="number"
            value={node.value as number}
            disabled={disabled}
            onChange={(e) => onChange({ ...node, value: e.target.valueAsNumber })}
          />
        ) : valueType === 'date' ? (
          <Input
            type="date"
            value={node.value as string}
            disabled={disabled}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
          />
        ) : (
          <Input
            value={node.value as string}
            disabled={disabled}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
          />
        )}
      </div>
    </>
  )
}
