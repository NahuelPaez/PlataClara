import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
import { formatARS, formatUSD, formatPct } from '../utils/formatters'

const FIELDS = [
  { id: 'monto',         label: 'Monto en pesos',               type: 'number', unit: '$',   defaultValue: 500000, min: 5000 },
  { id: 'tc',            label: 'Tipo de cambio CCL actual',     type: 'number', unit: '$/U$S', defaultValue: 1200, min: 1, hint: 'Tipo de cambio al momento de comprar' },
  { id: 'rendUSD',       label: 'Rendimiento esperado en USD',   type: 'number', unit: '%/año', defaultValue: 15, min: -100, max: 500, hint: 'Variación esperada del activo subyacente en dólares' },
  { id: 'variacionTC',   label: 'Variación del TC esperada',     type: 'number', unit: '%/año', defaultValue: 20, min: -50, max: 300, hint: 'Cuánto esperás que suba el dólar CCL en el año' },
  { id: 'meses',         label: 'Horizonte',                      type: 'number', unit: 'meses', defaultValue: 12, min: 1, max: 60 },
]

export default function Cedears() {
  const [resultado, setResultado] = useState(null)

  function calcular(v) {
    const monto = Number(v.monto)
    const tc = Number(v.tc)
    const rendUSD = Number(v.rendUSD) / 100
    const variacionTC = Number(v.variacionTC) / 100
    const meses = Number(v.meses)

    const montoUSD = monto / tc
    const rendMensualUSD = Math.pow(1 + rendUSD, 1 / 12) - 1
    const varMensualTC = Math.pow(1 + variacionTC, 1 / 12) - 1

    const serie = []
    let usd = montoUSD
    let tcActual = tc

    for (let m = 0; m <= meses; m++) {
      serie.push({
        mes: m,
        ars: Math.round(usd * tcActual),
        usd: Math.round(usd * 100) / 100,
      })
      if (m < meses) {
        usd *= (1 + rendMensualUSD)
        tcActual *= (1 + varMensualTC)
      }
    }

    const finalARS = serie[serie.length - 1].ars
    const finalUSD = serie[serie.length - 1].usd

    setResultado({ serie, finalARS, finalUSD, gananciaARS: finalARS - monto, gananciaUSD: finalUSD - montoUSD })
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
        <strong>CEDEARs:</strong> Son certificados que representan acciones extranjeras
        (Apple, Google, Tesla, etc.) compradas en pesos argentinos. Tu inversión combina
        el rendimiento del activo en USD + la variación del tipo de cambio.
        <strong className="block mt-1">⚠️ Alta volatilidad. Solo para perfil de riesgo medio-alto.</strong>
      </div>

      <SimuladorForm fields={FIELDS} onCalculate={calcular} />

      {resultado && (
        <>
          <SimuladorChart
            type="area"
            data={resultado.serie}
            xKey="mes"
            dataKeys={[{ key: 'ars', name: 'Valor en pesos ($)', color: '#0d7377' }]}
            result={{
              label: 'Valor final en pesos',
              value: formatARS(resultado.finalARS),
              sublabel: 'Ganancia en pesos',
              subvalue: formatARS(resultado.gananciaARS),
            }}
            formatTooltip={v => formatARS(v)}
          />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="card text-center py-3">
              <p className="text-xs text-slate-500 mb-1">Valor final en USD</p>
              <p className="text-lg font-bold text-slate-700">{formatUSD(resultado.finalUSD)}</p>
            </div>
            <div className={`card text-center py-3 ${resultado.gananciaARS >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className="text-xs text-slate-500 mb-1">Rendimiento total en $</p>
              <p className={`text-lg font-bold ${resultado.gananciaARS >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {resultado.gananciaARS >= 0 ? '+' : ''}{formatARS(resultado.gananciaARS)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Simulación simplificada con fines educativos. Los rendimientos reales varían y pueden ser negativos.
          </p>
        </>
      )}
    </div>
  )
}
