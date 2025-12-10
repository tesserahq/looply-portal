/* eslint-disable @typescript-eslint/no-explicit-any */
import { DateTime } from '@/components/datetime'
import DeleteConfirmation, {
  type DeleteConfirmationHandle,
} from '@/components/delete-confirmation/delete-confirmation'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from '@/context/AppContext'
import {
  useContactInteractionDetail,
  useDeleteContactInteraction,
} from '@/resources/hooks/contact-interactions'
import { useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { Badge } from '@shadcn/ui/badge'
import { Button } from '@shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@shadcn/ui/popover'
import { Edit, EllipsisVertical, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function ContactInteractionDetail() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const deleteConfirmationRef = useRef<DeleteConfirmationHandle>(null)

  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  }

  const { data: interaction, isLoading, error } = useContactInteractionDetail(config, id!)

  const { mutate: deleteContactInteraction, isPending: isDeleting } =
    useDeleteContactInteraction(config, {
      onSuccess: () => {
        deleteConfirmationRef.current?.close()
        navigate('/contact-interactions')
      },
    })

  const handleDelete = useCallback(() => {
    if (!id) return

    deleteConfirmationRef.current?.open({
      title: 'Delete Contact Interaction',
      description:
        'This will permanently delete this contact interaction. This action cannot be undone.',
      onDelete: async () => {
        deleteContactInteraction(id)
      },
      isLoading: false,
    })
  }, [id, deleteContactInteraction])

  useEffect(() => {
    if (isDeleting) {
      deleteConfirmationRef.current?.updateConfig({ isLoading: true })
    }
  }, [isDeleting])

  if (isLoading) {
    return <AppPreloader />
  }

  if (!interaction) {
    return (
      <div className="mx-auto w-full max-w-screen-lg animate-slide-up">
        <Card>
          <CardContent>
            <EmptyContent
              title="Contact Interaction Not Found"
              image="/images/empty-contacts.svg"
              description={
                error?.message ||
                `The contact interaction you're looking for doesn't exist or has been deleted.`
              }>
              <Button variant="black" onClick={() => navigate('/contact-interactions')}>
                Back to Contact Interactions
              </Button>
            </EmptyContent>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto h-full max-w-screen-lg animate-slide-up">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold lg:text-3xl">
              Contact Interaction Details
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="px-0">
                  <EllipsisVertical size={18} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="left" className="w-40 p-2">
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2"
                  onClick={() => navigate(`/contact-interactions/${id}/edit`)}>
                  <Edit size={18} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleDelete}>
                  <Trash2 size={18} />
                  <span>Delete</span>
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pt-4">
          <div className="d-list">
            <div className="d-item">
              <dt className="d-label">Note</dt>
              <dd className="d-content">
                {interaction.note ? (
                  <p className="whitespace-pre-wrap text-sm">{interaction.note}</p>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Action</dt>
              <dd className="d-content">
                <Badge variant="outline" className="capitalize">
                  {interaction.action || 'N/A'}
                </Badge>
              </dd>
            </div>
            {interaction.custom_action_description && (
              <div className="d-item">
                <dt className="d-label">Action Description</dt>
                <dd className="d-content">
                  <p className="whitespace-pre-wrap text-sm">
                    {interaction.custom_action_description}
                  </p>
                </dd>
              </div>
            )}
            <div className="d-item">
              <dt className="d-label">Interaction Time</dt>
              <dd className="d-content">
                {interaction.interaction_timestamp ? (
                  <DateTime date={interaction.interaction_timestamp} formatStr="PPpp" />
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Action Time</dt>
              <dd className="d-content">
                {interaction.action_timestamp ? (
                  <DateTime date={interaction.action_timestamp} formatStr="PPpp" />
                ) : (
                  'N/A'
                )}
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Created At</dt>
              <dd className="d-content">
                {interaction.created_at ? (
                  <DateTime date={interaction.created_at} />
                ) : (
                  'N/A'
                )}
              </dd>
            </div>
            <div className="d-item">
              <dt className="d-label">Updated At</dt>
              <dd className="d-content">
                {interaction.updated_at ? (
                  <DateTime date={interaction.updated_at} />
                ) : (
                  'N/A'
                )}
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmation ref={deleteConfirmationRef} />
    </div>
  )
}
