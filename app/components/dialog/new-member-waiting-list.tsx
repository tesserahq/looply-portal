import { Button } from '@shadcn/ui/button'
import { Checkbox } from '@shadcn/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shadcn/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@shadcn/ui/input-group'
import { Label } from '@shadcn/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@shadcn/ui/select'
import { useApp } from 'tessera-ui'
import useDebounce from '@/hooks/useDebounce'
import { useContacts } from '@/resources/hooks/contacts'
import { Link, useNavigate } from 'react-router'
import { Search, X } from 'lucide-react'
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { AppPreloader } from '../loader/pre-loader'
import { cn } from '@shadcn/lib/utils'
import { WaitingListStatusType } from '@/resources/queries/waiting-lists/waiting-list-member.type'

interface FuncProps {
  onOpen: () => void
  onClose: () => void
}

interface IProps {
  onAddMembers: (contactIds: string[], status?: string) => Promise<void>
  memberStatuses: WaitingListStatusType[]
  apiUrl: string
  nodeEnv: string
}

const NewMemberWaitingList: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { onAddMembers, memberStatuses, apiUrl, nodeEnv }: IProps,
  ref
) => {
  const navigate = useNavigate()
  const { token } = useApp()
  const [open, setOpen] = useState<boolean>(false)
  const [contactIds, setContactIds] = useState<string[]>([])
  const [search, setSearch] = useState<string>('')
  const [memberStatus, setMemberStatus] = useState<string>('')

  const config = {
    apiUrl,
    token: token!,
    nodeEnv: nodeEnv as 'development' | 'production' | 'test',
  }

  const hasSearchQuery = search && search.trim() !== ''

  const { data: contacts, isLoading } = useContacts(
    config,
    { page: 1, size: 100, q: hasSearchQuery ? search : undefined },
    {
      enabled: open && !!token,
    }
  )

  // Debounced search - only triggers when user types (not on initial load)
  useDebounce(
    () => {
      // Search is handled by the query hook
    },
    [search],
    500
  )

  useImperativeHandle(ref, () => ({
    onOpen() {
      setOpen(true)
    },
    onClose() {
      setOpen(false)
      setContactIds([])
      setMemberStatus('')
      setSearch('')
    },
  }))

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const onSave = async () => {
    if (contactIds.length === 0) return

    setIsSubmitting(true)
    try {
      await onAddMembers(contactIds, memberStatus || undefined)
      setContactIds([])
      setMemberStatus('')
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const onCloseDialog = () => {
    setOpen(false)
    setContactIds([])
  }

  const hasData = useMemo(() => {
    return contacts && contacts.items && contacts.items.length > 0
  }, [contacts?.items])

  const emptyContent = (
    <div className="flex h-48 flex-col items-center justify-center">
      <h1 className="dark:text-foreground text-xl font-semibold">No members found</h1>
      <p className="dark:text-foreground mt-1 text-sm opacity-70">
        Get started by creating your first contact
      </p>
      <Button variant="black" onClick={() => navigate('/contacts/new')} className="mt-3">
        New Contact
      </Button>
    </div>
  )

  const emptySearchContent = (
    <div className="flex h-48 flex-col items-center justify-center">
      <h1 className="dark:text-foreground text-xl font-semibold">No contacts found</h1>
      <p className="dark:text-foreground mt-1 text-sm opacity-70">
        Try adjusting your search criteria
      </p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh]">
        {/* HEADER */}
        <DialogHeader>
          <DialogTitle className="mb-2">New Member</DialogTitle>
        </DialogHeader>
        <div className="mb-3">
          <Label className="mb-3">Status</Label>
          <Select value={memberStatus} onValueChange={setMemberStatus}>
            <SelectTrigger className="bg-card" disabled={isLoading}>
              <span
                className={cn(
                  'capitalize',
                  !memberStatus && 'text-muted-foreground normal-case opacity-50'
                )}>
                {memberStatus || 'Select status'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {memberStatuses.map((status) => {
                return (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-start">
                        <p>{status.label}</p>
                        <span className="text-muted-foreground text-xs">{status.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {(hasData || search !== null) && (
          <>
            <Label className="mb-0">Members</Label>
            <InputGroup className="animate-slide-up dark:bg-card w-full bg-white">
              <InputGroupInput
                placeholder="Search members"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              {search && (
                <InputGroupAddon align="inline-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-transparent"
                    onClick={() => setSearch('')}>
                    <X />
                  </Button>
                </InputGroupAddon>
              )}
            </InputGroup>
          </>
        )}

        {/* BODY */}
        {isLoading ? (
          <AppPreloader className="h-auto" />
        ) : (
          <div className="animate-slide-up flex flex-col gap-1">
            {!hasData && !search && emptyContent}
            {!hasData && search && emptySearchContent}
            {hasData &&
              contacts?.items.map((contact) => {
                const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ')

                return (
                  <Label
                    key={contact.id}
                    className="bg-card hover:bg-accent/50 mb-1 flex items-start gap-3 rounded-lg
                      border p-3 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50
                      dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                    <Checkbox
                      id="tools"
                      value={contact.id}
                      onCheckedChange={(checked) => {
                        const filterContactIds = checked
                          ? [...contactIds, contact.id]
                          : contactIds.filter((val: string) => val !== contact.id)

                        setContactIds(filterContactIds)
                      }}
                      className="data-[state=checked]:border-blue-600
                        data-[state=checked]:bg-blue-600 data-[state=checked]:text-white
                        dark:data-[state=checked]:border-blue-700
                        dark:data-[state=checked]:bg-blue-700"
                    />
                    <div>
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="button-link text-xs leading-none">
                        {contact.email}
                      </Link>
                      <div className="mt-1 flex items-center gap-1">
                        {fullName && <p className="text-muted-foreground text-xs">{fullName} | </p>}
                        {contact.phone && (
                          <p className="text-muted-foreground text-xs">{contact.phone}</p>
                        )}
                      </div>
                    </div>
                  </Label>
                )
              })}
          </div>
        )}

        {/* FOOTER */}
        <DialogFooter className="flex w-full items-center justify-between!">
          <div>{contactIds.length > 0 && <span>{contactIds.length} Selected</span>}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCloseDialog}>
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || contactIds.length === 0 || !memberStatus}
              onClick={onSave}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default forwardRef(NewMemberWaitingList)
