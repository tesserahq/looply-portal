import { DataTable } from '@/components/data-table'
import { DateTime } from '@/components/datetime'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from 'tessera-ui'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import {
  useContactInteractions,
  useDeleteContactInteraction,
} from '@/resources/hooks/contact-interactions/use-contact-interaction'
import { ContactInteractionType } from '@/resources/queries/contact-interactions'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import type { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData, useNavigate } from 'react-router'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, EyeIcon, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'
import NewButton from '@/components/new-button/new-button'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/shadcn/ui/tooltip'

export async function loader({ request }: LoaderFunctionArgs) {
  const canonical = ensureCanonicalPagination(request, {
    defaultSize: 25,
    defaultPage: 1,
  })

  if (canonical instanceof Response) return canonical

  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv, size: canonical.size, page: canonical.page }
}

export default function ContactInteractions() {
  const { apiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const { data, isLoading } = useContactInteractions(config, {
    page,
    size,
  })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const { mutate: deleteContactInteraction } = useDeleteContactInteraction(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/contact-interactions')
    },
  })

  const handleDelete = useCallback(
    (contactInteraction: ContactInteractionType) => {
      deleteModalRef.current?.open({
        title: 'Remove Contact Interaction',
        description: `This will remove "${contactInteraction.note}" from your contact interactions. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteContactInteraction(contactInteraction.id)
        },
      })
    },
    [deleteContactInteraction]
  )

  const columns: ColumnDef<ContactInteractionType>[] = useMemo(
    () => [
      {
        accessorKey: 'note',
        header: 'Notes',
        cell: ({ row }) => {
          const { note, id } = row.original
          if (!note) return <span className="text-muted-foreground">-</span>
          return (
            <div className="inline">
              <Link to={`/contact-interactions/${id}`} className="button-link">
                <span className="line-clamp-2 text-sm">{note}</span>
              </Link>
            </div>
          )
        },
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const { action, custom_action_description } = row.original

          if (action === 'custom') {
            return (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline">{action}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{custom_action_description || '-'}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return action ? <Badge variant="outline">{action}</Badge> : '-'
        },
      },
      {
        accessorKey: 'interaction_timestamp',
        header: 'Interaction Time',
        size: 180,
        cell: ({ row }) => {
          const { interaction_timestamp } = row.original
          if (!interaction_timestamp) return <span className="text-muted-foreground">-</span>
          return <DateTime date={interaction_timestamp} formatStr="PPpp" />
        },
      },
      {
        accessorKey: 'action_timestamp',
        header: 'Action Time',
        size: 180,
        cell: ({ row }) => {
          const { action_timestamp } = row.original
          if (!action_timestamp) return <span className="text-muted-foreground">-</span>
          return <DateTime date={action_timestamp} formatStr="PPpp" />
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 180,
        cell: ({ row }) => {
          const { created_at } = row.original
          if (!created_at) return <span className="text-muted-foreground">-</span>
          return <DateTime date={created_at} />
        },
      },
      {
        accessorKey: 'id',
        header: '',
        size: 20,
        cell: ({ row }) => {
          const { id } = row.original

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="px-0">
                  <Ellipsis size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="right" className="w-40 p-2">
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/contact-interactions/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/contact-interactions/${id}/edit`)}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="hover:bg-destructive hover:text-destructive-foreground flex w-full
                    justify-start gap-2"
                  onClick={() => handleDelete(row.original)}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
          )
        },
      },
    ],
    [navigate]
  )

  if (isLoading) {
    return <AppPreloader />
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No contact interactions found"
      description="Contact interactions will appear here once they are created">
      <Button variant="black" onClick={() => navigate('/contact-interactions/new')}>
        New Contact Interaction
      </Button>
    </EmptyContent>
  )

  return (
    <div className="page-content h-full">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="page-title">Contact Interactions</h1>
        {hasData && (
          <NewButton
            label="New Contact Interaction"
            onClick={() => navigate('/contact-interactions/new')}
          />
        )}
      </div>
      {!hasData ? (
        emptyContent
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          meta={{
            page: data?.page || 1,
            pages: data?.pages || 1,
            size: data?.size || 1,
            total: data?.total || 0,
          }}
          isLoading={isLoading}
        />
      )}

      <DeleteConfirmation ref={deleteModalRef} />
    </div>
  )
}
