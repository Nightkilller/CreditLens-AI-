import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area } from 'recharts'
import { Clock } from 'lucide-react'

/**
 * TrendChart — Score history line chart.
 *
 * Shows overall score trend over time with zone coloring.
 */
export default function TrendChart({ history = [] }) {
  if (!history.length) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#1C7293]" />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Score History</h3>
        </div>
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-[#6B7280]">No score history yet</p>
        </div>
      </div>
    )
  }

  // Format data for Recharts
  const data = history
    .slice()
    .reverse()
    .map((item, idx) => ({
      index: idx + 1,
      score: item.overall_score,
      date: new Date(item.scored_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
    }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const score = payload[0].value
      let color = '#D6453D'
      if (score >= 75) color = '#1F9D55'
      else if (score >= 50) color = '#E5A93B'

      return (
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-md px-3 py-2">
          <p className="text-xs text-[#6B7280]">{payload[0].payload.date}</p>
          <p className="text-sm font-semibold" style={{ color }}>
            Score: {score}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[#1C7293]" />
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Score History</h3>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Zone reference lines */}
            <ReferenceLine y={75} stroke="#1F9D55" strokeDasharray="3 3" strokeOpacity={0.3} />
            <ReferenceLine y={50} stroke="#E5A93B" strokeDasharray="3 3" strokeOpacity={0.3} />

            <Line
              type="monotone"
              dataKey="score"
              stroke="#1C7293"
              strokeWidth={2}
              dot={{ r: 4, fill: '#1C7293', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#1C7293', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
