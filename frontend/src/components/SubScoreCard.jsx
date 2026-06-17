import { Droplets, TrendingUp, ShieldCheck, BarChart3 } from 'lucide-react'

const PILLAR_CONFIG = {
  liquidity: {
    label: 'Liquidity',
    icon: Droplets,
    description: 'Cash availability & debt coverage',
  },
  stability: {
    label: 'Stability',
    icon: BarChart3,
    description: 'Income consistency & reliability',
  },
  growth: {
    label: 'Growth',
    icon: TrendingUp,
    description: 'Business trajectory & expansion',
  },
  compliance: {
    label: 'Compliance',
    icon: ShieldCheck,
    description: 'Regulatory & filing adherence',
  },
}

function getScoreColor(score) {
  if (score >= 75) return '#1F9D55'
  if (score >= 50) return '#E5A93B'
  return '#D6453D'
}

export default function SubScoreCard({ pillar, data }) {
  const config = PILLAR_CONFIG[pillar] || { label: pillar, icon: BarChart3, description: '' }
  const Icon = config.icon
  const score = data?.score ?? 0
  const color = getScoreColor(score)
  const pct = Math.min(100, Math.max(0, score))

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color + '12' }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#1A1A1A]">{config.label}</h4>
            <p className="text-xs text-[#6B7280]">{config.description}</p>
          </div>
        </div>
        <span
          className="text-lg font-semibold"
          style={{ color }}
        >
          {Math.round(score)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-[#6B7280]">Weight: {((data?.weight || 0) * 100).toFixed(0)}%</span>
        <span
          className="text-[10px] font-medium"
          style={{ color }}
        >
          {data?.tier_label || ''}
        </span>
      </div>
    </div>
  )
}
