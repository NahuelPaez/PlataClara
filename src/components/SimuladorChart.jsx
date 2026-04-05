import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { formatARS } from '../utils/formatters'

const COLORS = ['#0d7377', '#10b981', '#f59e0b', '#6366f1', '#ef4444']

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  fontSize: '13px',
}

function formatYAxis(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

/**
 * SimuladorChart
 *
 * Props:
 *   type: 'area' | 'bar' | 'line'
 *   data, xKey, dataKeys
 *   xLabel?: string  — etiqueta del eje X
 *   yLabel?: string  — etiqueta del eje Y
 *   result: { label, value, sublabel?, subvalue?, extra? }
 *   formatTooltip?: (value) => string
 */
export default function SimuladorChart({
  type = 'area',
  data,
  xKey,
  dataKeys,
  xLabel,
  yLabel,
  result,
  formatTooltip,
}) {
  if (!data || data.length === 0) return null

  const fmt = formatTooltip || ((v) => formatARS(v))
  const Chart = type === 'bar' ? BarChart : type === 'line' ? LineChart : AreaChart

  // Margen izquierdo extra cuando hay etiqueta en Y
  const marginLeft = yLabel ? 24 : 8

  return (
    <div className="mt-6 space-y-4">
      {result && (
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[160px] bg-primary-50 rounded-2xl p-4 border border-primary-100">
            <p className="text-xs text-primary-600 font-medium uppercase tracking-wide mb-1">{result.label}</p>
            <p className="text-2xl md:text-3xl font-bold text-primary-700">{result.value}</p>
          </div>
          {result.sublabel && (
            <div className="flex-1 min-w-[160px] bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">{result.sublabel}</p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-700">{result.subvalue}</p>
            </div>
          )}
          {result.extra && (
            <div className={`flex-1 min-w-[160px] rounded-2xl p-4 border ${result.extra.positive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${result.extra.positive ? 'text-emerald-600' : 'text-red-600'}`}>{result.extra.label}</p>
              <p className={`text-2xl md:text-3xl font-bold ${result.extra.positive ? 'text-emerald-700' : 'text-red-700'}`}>{result.extra.value}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <ResponsiveContainer width="100%" height={270}>
          <Chart data={data} margin={{ top: 8, right: 16, left: marginLeft, bottom: xLabel ? 28 : 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              label={xLabel ? {
                value: xLabel,
                position: 'insideBottomRight',
                offset: 0,
                style: { fontSize: 11, fill: '#94a3b8', fontWeight: 500 },
              } : undefined}
            />

            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={60}
              label={yLabel ? {
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                offset: -marginLeft + 4,
                style: { fontSize: 11, fill: '#94a3b8', fontWeight: 500 },
              } : undefined}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [fmt(value), name]}
            />
            {dataKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}

            {dataKeys.map((dk, i) => {
              const color = dk.color || COLORS[i % COLORS.length]
              if (type === 'bar')
                return <Bar key={dk.key} dataKey={dk.key} name={dk.name} fill={color} radius={[6,6,0,0]} />
              if (type === 'line')
                return <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.name} stroke={color} strokeWidth={2.5} dot={false} />
              return (
                <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.name}
                  stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.12} dot={false} />
              )
            })}
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
