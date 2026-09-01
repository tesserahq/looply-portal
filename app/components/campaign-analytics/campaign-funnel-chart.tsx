import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@shadcn/ui/chart'
import { CampaignStatsType } from '@/resources/queries/campaigns/campaign.type'

const chartConfig = {
  count: {
    label: 'Recipients',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

interface CampaignFunnelChartProps {
  stats: CampaignStatsType
}

/**
 * Recipients -> Delivered -> Opened -> Clicked, from the campaign's
 * existing aggregate counts. Each stage narrows against the prior one.
 */
export function CampaignFunnelChart({ stats }: CampaignFunnelChartProps) {
  const chartData = [
    { name: 'Recipients', count: stats.recipient_count },
    { name: 'Delivered', count: stats.delivered_count },
    { name: 'Opened', count: stats.opened_count },
    { name: 'Clicked', count: stats.clicked_count },
  ]

  return (
    <ChartContainer config={chartConfig} className="max-h-[280px] w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
        <XAxis type="number" allowDecimals={false} fontSize={12} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill="hsl(var(--chart-1))" />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
