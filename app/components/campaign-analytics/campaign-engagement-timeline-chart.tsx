import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@shadcn/ui/chart'
import { CampaignEngagementTimelineType } from '@/resources/queries/campaigns/campaign.type'

const chartConfig = {
  opened_count: {
    label: 'Opened',
    color: 'hsl(var(--chart-1))',
  },
  clicked_count: {
    label: 'Clicked',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

interface CampaignEngagementTimelineChartProps {
  timeline: CampaignEngagementTimelineType
}

/**
 * First opens/clicks bucketed by time elapsed since send. Built from
 * first-occurrence opened_at/clicked_at timestamps, so this shows when
 * recipients first engaged, not repeat engagement.
 */
export function CampaignEngagementTimelineChart({
  timeline,
}: CampaignEngagementTimelineChartProps) {
  return (
    <ChartContainer config={chartConfig} className="max-h-[280px] w-full">
      <BarChart data={timeline.buckets} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
        <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="opened_count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="clicked_count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
