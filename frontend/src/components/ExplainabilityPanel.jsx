import { Info } from 'lucide-react'

/**
 * ExplainabilityPanel — "Why this score?" factor breakdown.
 *
 * Shows top factors as horizontal bars:
 *   - Green bars extending right = positive contribution to credit score
 *   - Red bars extending left = negative contribution to credit score
 *
 * Clean and readable for non-technical bank employees.
 */
export default function ExplainabilityPanel({ factors = [] }) {
  if (!factors.length) {
    return null
  }

  // Find max impact for normalization
  const maxImpact = Math.max(...factors.map((f) => f.impact), 0.01)

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Info className="w-4 h-4 text-[#1C7293]" />
        <h3 className="text-sm font-semibold text-[#1A1A1A]">Key Score Factors</h3>
      </div>

      <div className="space-y-4">
        {factors.map((factor, idx) => {
          const isPositive = factor.direction === 'positive'
          const barColor = isPositive ? '#1F9D55' : '#D6453D'
          const barWidth = (factor.impact / maxImpact) * 100

          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-[#1A1A1A]">{factor.feature}</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: barColor + '12',
                    color: barColor,
                  }}
                >
                  {isPositive ? 'Positive' : 'Negative'}
                </span>
              </div>

              {/* Bar visualization */}
              <div className="relative h-6 flex items-center">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#E5E7EB]" />

                {isPositive ? (
                  /* Positive bar: grows right from center */
                  <div className="absolute left-1/2 h-4 rounded-r-sm transition-all duration-700 ease-out"
                    style={{
                      width: `${barWidth / 2}%`,
                      backgroundColor: barColor,
                      opacity: 0.75,
                    }}
                  />
                ) : (
                  /* Negative bar: grows left from center */
                  <div className="absolute h-4 rounded-l-sm transition-all duration-700 ease-out"
                    style={{
                      right: '50%',
                      width: `${barWidth / 2}%`,
                      backgroundColor: barColor,
                      opacity: 0.75,
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between mt-4 pt-3 border-t border-[#E5E7EB]">
        <span className="text-[10px] text-[#D6453D] font-medium">Reduces Score</span>
        <span className="text-[10px] text-[#1F9D55] font-medium">Improves Score</span>
      </div>
    </div>
  )
}
