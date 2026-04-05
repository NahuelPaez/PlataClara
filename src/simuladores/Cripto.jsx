import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
import { formatARS, formatUSD, formatPct } from '../utils/formatters'

const MONEDAS = [
  { value: 'btc',  label: 'Bitcoin (BTC)',    rendAnual: 60,  volatilidad: 'muy alta' },
  { value: 'eth',  label: 'Ethereum (ETH)',   rendAnual: 50,  volatilidad: 'muy alta' },
  { value: 'usdt', label: 'USDT (stablecoin)',rendAnual: 5,   volatilidad: 'baja' },
  { value: 'usdc', label: 'USDC (stablecoin)',rendAnual: 5,   volatilidad: 'baja' },
]

const FIELDS = [
  { id: 'monto',    label: 'Monto en pesos',      type: 'number', unit: '$',   defaultValue: 100000, min: 1000 },
  { id: 'tc',       label: 'Tipo de cambio (CCL)', type: 'number', unit: '$/U$S', defaultValue: 1200, min: 1 },
  { id: 'moneda',   label: 'Criptomoneda',          type: 'select', defaultValue: 'btc',
    options: MONEDAS.map(m => ({ value: m.value, label: m.label })) },
  { id: 'rend',     label: 'Rendimiento anual esperado', type: 'number', unit: '%', defaultValue: 60, min: -100, max: 1000, hint: 'Histórico referencial. No garantizado.' },
  { id: 'meses',    label: 'Horizonte',             type: 'number', unit: 'meses', defaultValue: 12, min: 1, max: 60 },
]

export default function Cripto() {
  const [resultado, setResultado] = useState(null)

  function calcular(v) {
    const monto = Number(v.monto)
    const tc = Number(v.tc)
    const rendAnual = Number(v.rend) / 100
    const meses = Number(v.meses)

    const montoUSD = monto / tc
    const rendMensual = Math.pow(1 + rendAnual, 1 / 12) - 1

    const serie = []
    let usd = montoUSD
    for (let m = 0; m <= meses; m++) {
      serie.push({ mes: m, usd: Math.round(usd * 100) / 100, ars: Math.round(usd * tc) })
      if (m < meses) usd *= (1 + rendMensual)
    }

    const finalUSD = serie[serie.length - 1].usd
    const finalARS = finalUSD * tc

    setResultado({ serie, finalUSD, finalARS, gananciaUSD: finalUSD - montoUSD, gananciaARS: finalARS - monto, moneda: v.moneda })
  }

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
        <strong>⚠️ Advertencia importante:</strong> Las criptomonedas son activos de muy alta volatilidad.
        Podés perder una parte importante o todo tu capital en muy poco tiempo.
        Los rendimientos históricos <strong>no garantizan resultados futuros</strong>.
        Este simulador es solo educativo. No lo uses como base de una decisión de inversión real.
      </div>

      <SimuladorForm fields={FIELDS} onCalculate={calcular} />

      {resultado && (
        <>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-xs text-amber-700">
            Simulación calculando solo el tipo de cambio al momento de entrada (sin ajuste por variación del dólar).
          </div>
          <SimuladorChart
            type="line"
            data={resultado.serie}
            xKey="mes"
            dataKeys={[{ key: 'usd', name: 'Valor en USD', color: '#f59e0b' }]}
            result={{
              label: 'Valor final en USD',
              value: formatUSD(resultado.finalUSD),
              sublabel: 'Ganancia en USD',
              subvalue: `${resultado.gananciaUSD >= 0 ? '+' : ''}${formatUSD(resultado.gananciaUSD)}`,
            }}
            formatTooltip={v => formatUSD(v)}
          />
        </>
      )}
    </div>
  )
}
