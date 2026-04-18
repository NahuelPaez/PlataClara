import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
import GlosarioSimulador from '../components/GlosarioSimulador'
import { calcularTasaReal, formatARS, formatPct } from '../utils/formatters'

const GLOSARIO = [
  { term: '📉 Rendimiento real vs nominal', def: 'Una tasa del 40% anual suena alta, pero si la inflación es del 60% anual, en realidad perdés poder adquisitivo. Este simulador usa la ecuación de Fisher para mostrarte el rendimiento real de tu inversión.' },
  { term: '📊 Ecuación de Fisher', def: 'Fórmula que calcula el rendimiento real: (1 + tasa nominal) / (1 + inflación) - 1. Permite saber si tu inversión realmente ganó o perdió contra la inflación.' },
]

// Referencia de inflación mensual estimada (INDEC). Actualizar cuando salga el dato.
const INFLACION_REFERENCIA = 3.2

const FIELDS = [
  { id: 'monto',     label: 'Monto',                    type: 'number', unit: '$',     defaultValue: 100000, min: 100 },
  { id: 'tna',       label: 'TNA del instrumento',       type: 'number', unit: '%',     defaultValue: 40,     min: 0.1, max: 300, hint: 'La tasa que te ofrece el banco o billetera' },
  {
    id: 'inflacion',
    label: 'Inflación mensual esperada',
    type: 'number', unit: '%/mes', defaultValue: INFLACION_REFERENCIA, min: 0.1, max: 50,
    hint: 'Estimá cuánto esperás que suban los precios por mes',
    hintAction: { label: `📊 Ref. INDEC (${INFLACION_REFERENCIA}%)`, value: INFLACION_REFERENCIA },
  },
  { id: 'meses',     label: 'Horizonte',                 type: 'number', unit: 'meses', defaultValue: 12,     min: 1, max: 60 },
]

export default function InflacionReal() {
  const [resultado, setResultado] = useState(null)

  function calcular(v) {
    const monto = Number(v.monto)
    const tna = Number(v.tna)
    const inflacionMensual = Number(v.inflacion)
    const meses = Number(v.meses)

    const tasaNominalMensual = tna / 100 / 12
    const inflMensual = inflacionMensual / 100

    const serie = []
    let nominalAcum = monto
    let poderInicial = monto

    for (let m = 0; m <= meses; m++) {
      serie.push({
        mes: m,
        nominal: Math.round(nominalAcum),
        poder: Math.round(poderInicial * Math.pow(1 + inflMensual, m)),
      })
      if (m < meses) {
        nominalAcum *= (1 + tasaNominalMensual)
      }
    }

    const tasaReal = calcularTasaReal(tna, inflacionMensual)
    const totalNominal = serie[serie.length - 1].nominal
    const poderAdquisitivoFinal = totalNominal / Math.pow(1 + inflMensual, meses)

    setResultado({
      serie,
      tasaRealMensual: tasaReal.tasaRealMensual,
      tasaRealAnual: tasaReal.tasaRealAnual,
      ganaPoder: tasaReal.ganaPoder,
      totalNominal,
      poderAdquisitivoFinal,
    })
  }

  return (
    <div className="space-y-6">
      <GlosarioSimulador titulo="¿Cómo funciona este simulador?" terminos={GLOSARIO} />

      <SimuladorForm fields={FIELDS} onCalculate={calcular} />

      {resultado && (
        <>
          <div className={`rounded-2xl p-5 border ${resultado.ganaPoder ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`text-2xl font-extrabold mb-1 ${resultado.ganaPoder ? 'text-emerald-700' : 'text-red-700'}`}>
              {resultado.ganaPoder ? '✅ Ganás poder adquisitivo' : '⚠️ Perdés poder adquisitivo'}
            </div>
            <p className={`text-sm ${resultado.ganaPoder ? 'text-emerald-600' : 'text-red-600'}`}>
              Tasa real: <strong>{formatPct(resultado.tasaRealAnual)}</strong> anual
              ({formatPct(resultado.tasaRealMensual, 2)}/mes)
            </p>
          </div>

          <SimuladorChart
            type="line"
            data={resultado.serie}
            xKey="mes"
            dataKeys={[
              { key: 'nominal', name: 'Valor nominal ($)',  color: '#0d7377' },
              { key: 'poder',   name: 'Inflación acum. ($)', color: '#ef4444' },
            ]}
            result={{
              label: 'Total nominal al final',
              value: formatARS(resultado.totalNominal),
              sublabel: 'Poder adquisitivo real',
              subvalue: formatARS(resultado.poderAdquisitivoFinal),
            }}
            formatTooltip={v => formatARS(v)}
          />
          <p className="text-xs text-slate-400 text-center">
            La línea roja representa cuánto necesitarías tener para mantener el mismo poder adquisitivo inicial.
          </p>
        </>
      )}
    </div>
  )
}
