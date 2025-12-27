'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DailyStats {
  date: string
  views: number
  taps: number
  clicks: number
}

interface StatsChartProps {
  data: DailyStats[]
  title?: string
}

type MetricType = 'views' | 'taps' | 'clicks'

const METRIC_COLORS: Record<MetricType, string> = {
  views: '#40E0D0', // turquoise
  taps: '#FFD700', // yellow
  clicks: '#000000', // black
}

const METRIC_LABELS: Record<MetricType, string> = {
  views: 'Views',
  taps: 'Taps',
  clicks: 'Clicks',
}

export default function StatsChart({ data, title = 'Weekly Performance' }: StatsChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<MetricType[]>(['views', 'taps'])

  const toggleMetric = (metric: MetricType) => {
    setActiveMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    )
  }

  // Format data for chart
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
  }))

  // Calculate totals
  const totals = data.reduce(
    (acc, d) => ({
      views: acc.views + d.views,
      taps: acc.taps + d.taps,
      clicks: acc.clicks + d.clicks,
    }),
    { views: 0, taps: 0, clicks: 0 }
  )

  return (
    <div className="card p-6">
      <h3 className="text-headline-md font-display text-black mb-4">{title}</h3>

      {/* Metric toggles */}
      <div className="flex gap-4 mb-6">
        {(Object.keys(METRIC_LABELS) as MetricType[]).map((metric) => (
          <button
            key={metric}
            onClick={() => toggleMetric(metric)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
              activeMetrics.includes(metric)
                ? 'border-black bg-gray-50'
                : 'border-gray-200 opacity-50'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: METRIC_COLORS[metric] }}
            />
            <span className="text-body-sm font-medium">{METRIC_LABELS[metric]}</span>
            <span className="text-body-sm text-black/50">{totals[metric]}</span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              {(Object.keys(METRIC_COLORS) as MetricType[]).map((metric) => (
                <linearGradient
                  key={metric}
                  id={`gradient-${metric}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={METRIC_COLORS[metric]}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={METRIC_COLORS[metric]}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #000',
                borderRadius: '8px',
                boxShadow: '4px 4px 0 #000',
              }}
            />
            {activeMetrics.map((metric) => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={METRIC_COLORS[metric]}
                strokeWidth={2}
                fill={`url(#gradient-${metric})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-headline-lg font-display text-bahamian-turquoise">
            {totals.views}
          </div>
          <div className="text-body-sm text-black/50">Total Views</div>
        </div>
        <div className="text-center">
          <div className="text-headline-lg font-display text-bahamian-yellow">
            {totals.taps}
          </div>
          <div className="text-body-sm text-black/50">Total Taps</div>
        </div>
        <div className="text-center">
          <div className="text-headline-lg font-display text-black">
            {totals.clicks}
          </div>
          <div className="text-body-sm text-black/50">Total Clicks</div>
        </div>
      </div>
    </div>
  )
}


