/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useApp } from '@/context/AppContext'
import useDebounce from '@/hooks/useDebounce'
import { useHandleApiError } from '@/hooks/useHandleApiError'
import { fetchApi, NodeENVType } from '@/libraries/fetch'
import { IContact } from '@/types/contact'
import { IPaging } from '@/types/pagination'
import { IWaitingListStatus } from '@/types/waiting-list'
import { FetcherWithComponents, Link, useNavigate, useParams } from '@remix-run/react'
import { Search, X } from 'lucide-react'
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { AppPreloader } from '../AppPreloader'
import { cn } from '@/utils/misc'

interface FuncProps {
  onOpen: () => void
  onClose: () => void
}

interface IProps {
  fetcher: FetcherWithComponents<unknown>
  apiUrl: string
  nodeEnv: NodeENVType
  memberStatuses: IWaitingListStatus[]
}

const NewMemberWaitingList: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { fetcher, apiUrl, nodeEnv, memberStatuses }: IProps,
  ref,
) => {
  const params = useParams()
  const navigate = useNavigate()
  const { token } = useApp()
  const [open, setOpen] = useState<boolean>(false)
  const handleApiError = useHandleApiError()
  const [contactIds, setContactIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [contacts, setContacts] = useState<IPaging<IContact>>()
  const [memberStatus, setMemberStatus] = useState<string>('')

  const fetchData = async (searchQuery?: string) => {
    if (!token) return

    // Determine endpoint and params based on search query
    const hasSearchQuery = searchQuery && searchQuery.trim() !== ''
    const endpoint = hasSearchQuery ? `${apiUrl}/contacts/search` : `${apiUrl}/contacts`
    const params = hasSearchQuery ? { q: searchQuery } : {}

    try {
      const contacts = await fetchApi(endpoint, token, nodeEnv, {
        params,
      })

      setContacts(contacts)
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSearch = async (search: string) => {
    if (!token) return
    await fetchData(search)
  }

  // Debounced search - only triggers when user types (not on initial load)
  useDebounce(
    () => {
      // prevent on first load
      if (!isLoading) {
        setIsLoading(true)
        fetchSearch(search)
      }
    },
    [search],
    500,
  )

  useImperativeHandle(ref, () => ({
    onOpen() {
      setOpen(true)
      fetchData()
    },
    onClose() {
      setOpen(false)
    },
  }))

  const isSubmitting = useMemo(() => fetcher.state === 'submitting', [fetcher.state])

  const onSave = async () => {
    if (params.id && token) {
      const formData = new FormData()
      formData.append('intent', 'new_member_waiting_list')
      formData.append('waiting_list_id', params?.id || '')
      formData.append('status', memberStatus)
      formData.append('contact_ids', JSON.stringify(contactIds))
      formData.append('token', token!)

      fetcher.submit(formData, {
        method: 'POST',
      })

      setContactIds([])
      setMemberStatus('')
    }
  }

  const onCloseDialog = () => {
    setOpen(false)
    setContactIds([])
    setIsLoading(true)
  }

  const hasData = useMemo(() => {
    return contacts && contacts.items && contacts.items.length > 0
  }, [contacts])

  const emptyContent = (
    <div className="flex h-48 flex-col items-center justify-center">
      <h1 className="text-xl font-semibold dark:text-foreground">No members found</h1>
      <p className="mt-1 text-sm opacity-70 dark:text-foreground">
        Get started by creating your first contact
      </p>
      <Button variant="black" onClick={() => navigate('/contacts/new')} className="mt-3">
        New Contact
      </Button>
    </div>
  )

  const emptySearchContent = (
    <div className="flex h-48 flex-col items-center justify-center">
      <h1 className="text-xl font-semibold dark:text-foreground">No contacts found</h1>
      <p className="mt-1 text-sm opacity-70 dark:text-foreground">
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
          <Label>Status</Label>
          <Select value={memberStatus} onValueChange={setMemberStatus}>
            <SelectTrigger className="bg-card" disabled={isLoading}>
              <span
                className={cn(
                  'capitalize',
                  !memberStatus && 'normal-case text-muted-foreground opacity-50',
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
                        <span className="text-xs text-muted-foreground">
                          {status.description}
                        </span>
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
            <InputGroup className="w-full animate-slide-up bg-white dark:bg-card">
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
          <div className="flex animate-slide-up flex-col gap-1">
            {!hasData && !search && emptyContent}
            {!hasData && search && emptySearchContent}
            {hasData &&
              contacts?.items.map((contact) => {
                const fullName = [contact.first_name, contact.last_name]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <Label
                    key={contact.id}
                    className="mb-1 flex items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/50 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                    <Checkbox
                      id="tools"
                      value={contact.id}
                      onCheckedChange={(checked) => {
                        const filterContactIds = checked
                          ? [...contactIds, contact.id]
                          : contactIds.filter((val: any) => val !== contact.id)

                        setContactIds(filterContactIds)
                      }}
                      className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                    />
                    <div>
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="button-link text-xs leading-none">
                        {contact.email}
                      </Link>
                      <div className="mt-1 flex items-center gap-1">
                        {fullName && (
                          <p className="text-xs text-muted-foreground">{fullName} | </p>
                        )}
                        {contact.phone && (
                          <p className="text-xs text-muted-foreground">{contact.phone}</p>
                        )}
                      </div>
                    </div>
                  </Label>
                )
              })}
          </div>
        )}

        {/* FOOTER */}
        <DialogFooter className="flex w-full items-center !justify-between">
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
