import { DataTable } from '@/components/data-table'
import { NewCampaignModal } from '@/components/dialog/new-campaign-modal'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import DeleteConfirmation from '@/components/delete-confirmation/delete-confirmation'
import SendConfirmation from '@/components/send-confirmation/send-confirmation'
import { CampaignStatusBadge } from '@/components/campaign-status/campaign-status'
import { useApp, DateTime, ResourceID } from 'tessera-ui'
import { useCampaigns, useDeleteCampaign, useSendCampaign } from '@/resources/hooks/campaigns'
import { CampaignType } from '@/resources/queries/campaigns'
import { ensureCanonicalPagination } from '@/utils/helpers/pagination.helper'
import type { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData, useNavigate } from 'react-router'
import { Button } from '@shadcn/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Ellipsis, EyeIcon, Send, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import NewButton from '@/components/new-button/new-button'

export async function loader({ request }: LoaderFunctionArgs) {
  const canonical = ensureCanonicalPagination(request, {
    defaultSize: 25,
    defaultPage: 1,
  })

  if (canonical instanceof Response) return canonical

  const apiUrl = process.env.API_URL
  const sendlyApiUrl = process.env.SENDLY_API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, sendlyApiUrl, nodeEnv, size: canonical.size, page: canonical.page }
}

export default function Campaigns() {
  const { apiUrl, sendlyApiUrl, nodeEnv, size, page } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const deleteModalRef = useRef<React.ComponentRef<typeof DeleteConfirmation>>(null)
  const sendModalRef = useRef<React.ComponentRef<typeof SendConfirmation>>(null)
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false)

  const config = {
    nodeEnv,
    apiUrl: apiUrl!,
    token: token!,
  }

  const { data, isLoading } = useCampaigns(config, {
    page,
    size,
  })

  const hasData = useMemo(() => {
    return data && data.items && data.items.length > 0
  }, [data])

  const { mutate: deleteCampaign } = useDeleteCampaign(config, {
    onSuccess: () => {
      deleteModalRef.current?.close()
      navigate('/campaigns')
    },
  })

  const { mutateAsync: sendCampaign } = useSendCampaign(config, {
    onSuccess: () => {
      sendModalRef.current?.close()
    },
  })

  const handleDelete = useCallback(
    (campaign: CampaignType) => {
      deleteModalRef.current?.open({
        title: 'Remove Campaign',
        description: `This will remove "${campaign.name}" from your campaigns. This action cannot be undone.`,
        onDelete: async () => {
          deleteModalRef.current?.updateConfig({ isLoading: true })
          await deleteCampaign(campaign.id)
        },
      })
    },
    [deleteCampaign]
  )

  const handleSend = useCallback(
    (campaign: CampaignType) => {
      sendModalRef.current?.open({
        title: 'Send Campaign',
        description: `This will send "${campaign.name}" to its contact list.`,
        onSend: async () => {
          sendModalRef.current?.updateConfig({ isLoading: true })
          await sendCampaign(campaign.id)
        },
      })
    },
    [sendCampaign]
  )

  const columns: ColumnDef<CampaignType>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 250,
        cell: ({ row }) => {
          const name = row.original.name
          if (!name) return <span className="text-muted-foreground">-</span>
          return (
            <div className="inline">
              <Link to={`/campaigns/${row.original.id}`} className="button-link">
                <span className="text-sm font-medium">{name}</span>
              </Link>
            </div>
          )
        },
      },
      {
        accessorKey: 'subject',
        header: 'Subject',
        size: 250,
        cell: ({ row }) => {
          const { subject } = row.original
          if (!subject) return <span className="text-muted-foreground">-</span>
          return <span className="text-muted-foreground line-clamp-2 text-sm">{subject}</span>
        },
      },
      {
        accessorKey: 'from_email',
        header: 'From Email',
        size: 200,
        cell: ({ row }) => {
          const { from_email } = row.original
          if (!from_email) return <span className="text-muted-foreground">-</span>
          return <span className="text-sm">{from_email}</span>
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        cell: ({ row }) => {
          return <CampaignStatusBadge status={row.original.status} />
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 100,
        cell: ({ row }) => {
          const { created_at } = row.original
          if (!created_at) return <span className="text-muted-foreground">-</span>
          return <DateTime date={created_at} formatStr="dd/MM/yyyy" />
        },
      },
      {
        accessorKey: 'id',
        header: 'ID',
        size: 20,
        cell: ({ row }) => {
          return <ResourceID value={row.original.id} />
        },
      },
      {
        accessorKey: 'id',
        header: '',
        size: 20,
        cell: ({ row }) => {
          const { id, status } = row.original

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
                  onClick={() => navigate(`/campaigns/${id}`)}>
                  <EyeIcon size={18} />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  disabled={status !== 'draft'}
                  onClick={() => {
                    navigate(`/campaigns/${id}/edit`)
                  }}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  disabled={status !== 'draft'}
                  onClick={() => handleSend(row.original)}>
                  <Send size={18} />
                  <span>Send</span>
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
    [navigate, handleDelete, handleSend]
  )

  if (isLoading) {
    return <AppPreloader />
  }

  const emptyContent = (
    <EmptyContent
      image="/images/empty-contacts.svg"
      title="No campaigns found"
      description="Get started by creating your first campaign">
      <Button variant="black" onClick={() => setShowNewCampaignModal(true)}>
        New Campaign
      </Button>
    </EmptyContent>
  )

  return (
    <div className="page-content h-full">
      <div className="mb-5 animate-slide-up flex items-center justify-between">
        <h1 className="page-title">Campaigns</h1>
        {hasData && (
          <NewButton label="New Campaign" onClick={() => setShowNewCampaignModal(true)} />
        )}
      </div>
      <div className="animate-slide-up">
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
      </div>

      <DeleteConfirmation ref={deleteModalRef} />
      <SendConfirmation ref={sendModalRef} />
      <NewCampaignModal
        open={showNewCampaignModal}
        onOpenChange={setShowNewCampaignModal}
        apiUrl={apiUrl!}
        sendlyApiUrl={sendlyApiUrl!}
        nodeEnv={nodeEnv}
      />
    </div>
  )
}
