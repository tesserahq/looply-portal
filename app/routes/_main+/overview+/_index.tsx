import { DataTable } from '@/components/data-table'
import { DateTime } from '@/components/datetime'
import EmptyContent from '@/components/empty-content/empty-content'
import { AppPreloader } from '@/components/loader/pre-loader'
import { useApp } from '@/context/AppContext'
import { Button } from '@/modules/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcn/ui/card'
import { useStats } from '@/resources/hooks/stats'
import { StatsContactInteractionType, StatsContactType } from '@/resources/queries/stats'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { Badge } from '@shadcn/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

export function loader() {
  const apiUrl = process.env.API_URL
  const nodeEnv = process.env.NODE_ENV

  return { apiUrl, nodeEnv }
}

export default function Overview() {
  const { apiUrl, nodeEnv } = useLoaderData<typeof loader>()
  const { token } = useApp()
  const navigate = useNavigate()
  const config = {
    apiUrl: apiUrl!,
    nodeEnv,
    token: token!,
  } as const

  const { data, isLoading } = useStats(config)

  const upcomingInteractionsColumns: ColumnDef<StatsContactInteractionType>[] = useMemo(
    () => [
      {
        accessorKey: 'note',
        header: 'Note',
        cell: ({ row }) => {
          const { note, id } = row.original
          if (!note) return <span className="text-muted-foreground">-</span>
          return (
            <Link to={`/contact-interactions/${id}`} className="button-link">
              <span className="line-clamp-2 text-sm">{note}</span>
            </Link>
          )
        },
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const { action } = row.original
          return (
            <Badge variant="outline" className="capitalize">
              {action || '-'}
            </Badge>
          )
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
        accessorKey: 'contact.email',
        header: 'Contact Email',
        cell: ({ row }) => {
          const { contact } = row.original
          return (
            <Link to={`/contacts/${contact.id}`} className="button-link">
              <span className="text-sm">{contact.email || '-'}</span>
            </Link>
          )
        },
      },
    ],
    []
  )

  const recentContactsColumns: ColumnDef<StatsContactType>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const { first_name, last_name, id } = row.original
          const fullName = `${first_name || ''} ${last_name || ''}`.trim() || '-'
          return (
            <Link to={`/contacts/${id}`} className="button-link">
              <span className="text-sm">{fullName}</span>
            </Link>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
          const { email } = row.original
          if (!email) return <span className="text-muted-foreground">-</span>
          return <span className="text-sm">{email}</span>
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 130,
        cell: ({ row }) => {
          const { created_at } = row.original
          if (!created_at) return <span className="text-muted-foreground">-</span>
          return <DateTime date={created_at} formatStr="PPpp" />
        },
      },
    ],
    []
  )

  const hasUpcomingInteractions = useMemo(() => {
    return data?.upcoming_interactions && data.upcoming_interactions.length > 0
  }, [data])

  const hasRecentContacts = useMemo(() => {
    return data?.recent_contacts && data.recent_contacts.length > 0
  }, [data])

  if (isLoading) {
    return <AppPreloader />
  }

  return (
    <div>
      <div className="animate-slide-up mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Overview</h1>
      </div>

      {/* Total Stats */}
      <div className="animate-slide-up grid gap-2 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <Card>
          <CardHeader>
            <CardDescription># of Contacts</CardDescription>
            <CardTitle className="text-3xl font-semibold">{data?.total_contacts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription># of Contact Lists</CardDescription>
            <CardTitle className="text-3xl font-semibold">{data?.total_list}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription># of Public Lists</CardDescription>
            <CardTitle className="text-3xl font-semibold">{data?.total_public_list}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription># of Private Lists</CardDescription>
            <CardTitle className="text-3xl font-semibold">{data?.total_private_list}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="animate-slide-up mt-2 grid gap-2 lg:mt-5 lg:grid-cols-2 lg:gap-5">
        {/* Upcoming Interactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Upcoming Interactions</CardTitle>
                <CardDescription>Recent interactions that are scheduled</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/contact-interactions')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!hasUpcomingInteractions ? (
              <EmptyContent
                image="/images/empty-contacts.svg"
                title="No upcoming interactions"
                description="Upcoming interactions will appear here once they are scheduled"
              />
            ) : (
              <DataTable
                columns={upcomingInteractionsColumns}
                data={data?.upcoming_interactions || []}
                isLoading={isLoading}
                fixed={false}
                empty={
                  <EmptyContent
                    image="/images/empty-contacts.svg"
                    title="No upcoming interactions"
                    description="Upcoming interactions will appear here once they are scheduled"
                  />
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Contacts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Recent Contacts</CardTitle>
                <CardDescription>Recently added contacts</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/contacts')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!hasRecentContacts ? (
              <EmptyContent
                image="/images/empty-contacts.svg"
                title="No recent contacts"
                description="Recent contacts will appear here once they are added"
              />
            ) : (
              <DataTable
                columns={recentContactsColumns}
                data={data?.recent_contacts || []}
                isLoading={isLoading}
                fixed={false}
                empty={
                  <EmptyContent
                    image="/images/empty-contacts.svg"
                    title="No recent contacts"
                    description="Recent contacts will appear here once they are added"
                  />
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
