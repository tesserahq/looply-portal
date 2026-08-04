import { Button } from '@shadcn/ui/button'
import { Checkbox } from '@shadcn/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shadcn/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@shadcn/ui/input-group'
import { Label } from '@shadcn/ui/label'
import { useApp } from 'tessera-ui'
import { contactQueryKeys } from '@/resources/hooks/contacts'
import { useAddContactListMembers, useContactLists } from '@/resources/hooks/contact-lists'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Search, X } from 'lucide-react'
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { AppPreloader } from '../loader/pre-loader'
import { NodeENVType } from '@/libraries/fetch'

interface FuncProps {
  onOpen: () => void
  onClose: () => void
}

interface IProps {
  contactId: string
  apiUrl: string
  nodeEnv: NodeENVType
}

const AddContactToList: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { contactId, apiUrl, nodeEnv }: IProps,
  ref
) => {
  const navigate = useNavigate()
  const { token } = useApp()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState<boolean>(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')

  const config = {
    apiUrl,
    token: token!,
    nodeEnv: nodeEnv,
  }

  const { data: contactLists, isLoading } = useContactLists(
    config,
    { page: 1, size: 100 },
    {
      enabled: open && !!token,
    }
  )

  const resetState = () => {
    setOpen(false)
    setSelectedListId(null)
    setSearch('')
  }

  useImperativeHandle(ref, () => ({
    onOpen() {
      setOpen(true)
    },
    onClose() {
      resetState()
    },
  }))

  const { mutateAsync: addMembers, isPending } = useAddContactListMembers(
    config,
    selectedListId ?? '',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: contactQueryKeys.detail(contactId) })
        resetState()
      },
    }
  )

  const onSave = async () => {
    if (!selectedListId) return

    await addMembers({ contact_ids: [contactId] })
  }

  const filteredContactLists = useMemo(() => {
    if (!contactLists?.items) return []
    if (!search.trim()) return contactLists.items

    const query = search.trim().toLowerCase()
    return contactLists.items.filter((list) => list.name.toLowerCase().includes(query))
  }, [contactLists, search])

  const hasData = filteredContactLists.length > 0
  const hasAnyContactLists = Boolean(contactLists?.items && contactLists.items.length > 0)

  const emptyContent = (
    <div className="flex h-48 flex-col items-center justify-center">
      <h1 className="dark:text-foreground text-xl font-semibold">No contact lists found</h1>
      <p className="dark:text-foreground mt-1 text-sm opacity-70">
        Get started by creating your first contact list
      </p>
      <Button variant="black" onClick={() => navigate('/contact-lists/new')} className="mt-3">
        New Contact List
      </Button>
    </div>
  )

  const emptySearchContent = (
    <div className="flex h-48 flex-col items-center justify-center">
      <h1 className="dark:text-foreground text-xl font-semibold">No contact lists found</h1>
      <p className="dark:text-foreground mt-1 text-sm opacity-70">
        Try adjusting your search criteria
      </p>
    </div>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetState()
        } else {
          setOpen(true)
        }
      }}>
      <DialogContent className="max-h-[90vh]">
        {/* HEADER */}
        <DialogHeader>
          <DialogTitle className="mb-2">Add to Contact List</DialogTitle>
          {(hasAnyContactLists || search !== '') && (
            <InputGroup className="animate-slide-up dark:bg-card w-full bg-white">
              <InputGroupInput
                placeholder="Search contact lists"
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
          )}
        </DialogHeader>

        {/* BODY */}
        {isLoading ? (
          <AppPreloader className="h-auto" />
        ) : (
          <div className="animate-slide-up flex flex-col gap-1 overflow-y-auto max-h-[500px]">
            {!hasData && !search && emptyContent}
            {!hasData && search && emptySearchContent}
            {hasData &&
              filteredContactLists.map((list) => (
                <Label
                  key={list.id}
                  className="bg-card hover:bg-accent/50 mb-1 flex items-start gap-3 rounded-lg
                    border p-3 has-aria-checked:border-primary has-aria-checked:bg-accent/50
                    dark:has-aria-checked:border-primary dark:has-aria-checked:bg-primary
                    hover:cursor-pointer">
                  <Checkbox
                    checked={selectedListId === list.id}
                    onCheckedChange={(checked) => {
                      setSelectedListId(checked ? list.id : null)
                    }}
                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary
                      data-[state=checked]:text-white dark:data-[state=checked]:border-primary
                      dark:data-[state=checked]:bg-primary"
                  />
                  <div>
                    <p className="text-xs leading-none font-medium">{list.name}</p>
                    <div className="mt-1 flex items-center gap-1">
                      {list.description && (
                        <p className="text-muted-foreground text-xs">{list.description}</p>
                      )}
                    </div>
                  </div>
                </Label>
              ))}
          </div>
        )}

        {/* FOOTER */}
        <DialogFooter className="flex w-full items-center justify-between!">
          <div>{selectedListId && <span>1 Selected</span>}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetState}>
              Cancel
            </Button>
            <Button disabled={isPending || !selectedListId} onClick={onSave}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default forwardRef(AddContactToList)
