import { useMemo } from 'react'

/**
 * ScoreGauge — Semi-circular arc gauge for the Financial Health Score.
 *
 * Displays 0-100 score with color-coded zones:
 *   - Green (75-100): Healthy
 *   - Amber (50-74): Moderate Risk
 *   - Red (0-49): High Risk
 *
 * Score number displayed in muted gold (#D4AF37) in the center.
 */
export default function ScoreGauge({ score = 0, size = 240 }) {
  const config = useMemo(() => {
    const cx = size / 2
    const cy = size / 2 + 10
    const radius = size / 2 - 20
    const strokeWidth = 16

    // Arc from 180° (left) to 0° (right) — semi-circle
    const startAngle = Math.PI   // 180°
    const endAngle = 0           // 0°

    // Score to angle mapping
    const scoreAngle = startAngle - (score / 100) * Math.PI

    // SVG arc path helper
    const describeArc = (startA, endA) => {
      const x1 = cx + radius * Math.cos(startA)
      const y1 = cy - radius * Math.sin(startA)
      const x2 = cx + radius * Math.cos(endA)
      const y2 = cy - radius * Math.sin(endA)
      const largeArc = (startA - endA) > Math.PI ? 1 : 0
      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
    }

    // Color based on score
    let scoreColor = '#D6453D' // red
    if (score >= 75) scoreColor = '#1F9D55'
    else if (score >= 50) scoreColor = '#E5A93B'

    // Tier label
    let tierLabel = 'High Risk'
    if (score >= 75) tierLabel = 'Healthy'
    else if (score >= 50) tierLabel = 'Moderate Risk'

    return {
      cx, cy, radius, strokeWidth,
      backgroundArc: describeArc(startAngle, endAngle),
      scoreArc: score > 0 ? describeArc(startAngle, scoreAngle) : '',
      scoreColor, tierLabel,
      // Zone arcs for subtle background coloring
      redArc: describeArc(startAngle, startAngle - (49 / 100) * Math.PI),
      amberArc: describeArc(startAngle - (50 / 100) * Math.PI, startAngle - (74 / 100) * Math.PI),
      greenArc: describeArc(startAngle - (75 / 100) * Math.PI, endAngle),
    }
  }, [score, size])

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 40} viewBox={`0 0 ${size} ${size / 2 + 40}`}>
        {/* Background track */}
        <path
          d={config.backgroundArc}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />

        {/* Zone indicators (very subtle) */}
        <path d={config.redArc} fill="none" stroke="#D6453D" strokeWidth={config.strokeWidth} strokeLinecap="round" opacity="0.08" />
        <path d={config.amberArc} fill="none" stroke="#E5A93B" strokeWidth={config.strokeWidth} strokeLinecap="round" opacity="0.08" />
        <path d={config.greenArc} fill="none" stroke="#1F9D55" strokeWidth={config.strokeWidth} strokeLinecap="round" opacity="0.08" />

        {/* Score arc */}
        {config.scoreArc && (
          <path
            d={config.scoreArc}
            fill="none"
            stroke={config.scoreColor}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}

        {/* Score number */}
        <text
          x={config.cx}
          y={config.cy - 10}
          textAnchor="middle"
          className="font-semibold"
          style={{ fontSize: '42px', fill: '#D4AF37', fontFamily: 'Inter, sans-serif' }}
        >
          {Math.round(score)}
        </text>

        {/* Label */}
        <text
          x={config.cx}
          y={config.cy + 16}
          textAnchor="middle"
          style={{ fontSize: '13px', fill: '#6B7280', fontFamily: 'Inter, sans-serif' }}
        >
          Financial Health Score
        </text>

        {/* Min / Max labels */}
        <text
          x={20}
          y={config.cy + 30}
          textAnchor="start"
          style={{ fontSize: '11px', fill: '#6B7280', fontFamily: 'Inter, sans-serif' }}
        >
          0
        </text>
        <text
          x={size - 20}
          y={config.cy + 30}
          textAnchor="end"
          style={{ fontSize: '11px', fill: '#6B7280', fontFamily: 'Inter, sans-serif' }}
        >
          100
        </text>
      </svg>

      {/* Tier badge */}
      <div
        className="mt-1 px-3 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: config.scoreColor + '15',
          color: config.scoreColor,
        }}
      >
        {config.tierLabel}
      </div>
    </div>
  )
}
