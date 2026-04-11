import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
import GlosarioSimulador from '../components/GlosarioSimulador'
import InflacionCheck from '../components/InflacionCheck'
import { calcularPlazoFijo, formatARS, formatUSD } from '../utils/formatters'

const INFLACION_REFERENCIA = 3.2

const FIELDS_PESOS = [
  { id: 'monto', label: 'Monto',  type: 'number', unit: '$',    defaultValue: 100000, min: 1000 },
  { id: 'dias',  label: 'Plazo',  type: 'number', unit: 'días', defaultValue: 30,     min: 30, max: 365 },
  { id: 'tna',   label: 'TNA',    type: 'number', unit: '%',    defaultValue: 40,     min: 0.1, max: 200, hint: 'Consultá la tasa actual de tu banco' },
]

const FIELDS_UVA = [
  { id: 'monto',     label: 'Monto',                       type: 'number', unit: '$',     defaultValue: 100000, min: 1000 },
  { id: 'meses',     label: 'Plazo',                        type: 'number', unit: 'meses', defaultValue: 3,      min: 3, max: 24 },
  {
    id: 'inflacion',
    label: 'Inflación mensual esperada',
    type: 'number', unit: '%', defaultValue: INFLACION_REFERENCIA, min: 0.1, max: 30,
    hint: 'Estimá cuánto va a subir el IPC por mes',
    hintAction: { label: `📊 Ref. INDEC (${INFLACION_REFERENCIA}%)`, value: INFLACION_REFERENCIA },
  },
  { id: 'spread', label: 'Tasa real (spread)', type: 'number', unit: '%', defaultValue: 1, min: 0, max: 5, hint: 'CER + este % anual' },
]

const FIELDS_USD = [
  { id: 'monto', label: 'Monto',      type: 'number', unit: 'U$S', defaultValue: 5000, min: 100 },
  { id: 'dias',  label: 'Plazo',       type: 'number', unit: 'días', defaultValue: 30, min: 30, max: 365 },
  { id: 'tna',   label: 'TNA en USD', type: 'number', unit: '%',   defaultValue: 2,   min: 0.1, max: 20, hint: 'Típicamente 1-3% anual' },
]

const GLOSARIO = [
  { term: '📊 TNA (Tasa Nominal Anual)', def: 'Tasa de interés anual sin capitalización. Es la que publican los bancos para sus plazos fijos. Para calcular cuánto ganás en N días: Capital × TNA / 365 × N.' },
  { term: '📈 UVA (Unidad de Valor Adquisitivo)', def: 'Unidad de indexación que ajusta por inflación usando el índice CER (Coeficiente de Estabilización de Referencia). Un plazo fijo UVA te garantiza que tu capital no pierda poder adquisitivo, más una pequeña tasa real positiva.' },
  { term: '🔒 CER (Coeficiente de Estabilización de Referencia)', def: 'Índice publicado por el BCRA que sigue la inflación oficial (IPC). Es la base del ajuste de los plazos fijos UVA y varios bonos soberanos.' },
]

export default function PlazoFijo({ initialTipo = 'pesos' }) {
  const [tipo, setTipo] = useState(initialTipo)
  const [resultado, setResultado] = useState(null)
  const [tnaUsada, setTnaUsada] = useState(null)

  function calcular(v) {
    if (tipo === 'pesos') {
      const r = calcularPlazoFijo(Number(v.monto), Number(v.tna), Number(v.dias))
      setTnaUsada(Number(v.tna))
      setResultado({ tipo, chartData: [
        { categoria: 'Capital',   monto: Math.round(Number(v.monto)) },
        { categoria: 'Intereses', monto: Math.round(r.interes) },
      ], ...r })
    } else if (tipo === 'uva') {
      setTnaUsada(null)
      const meses = Number(v.meses)
      const inflMensual = Number(v.inflacion) / 100
      const spreadMensual = Number(v.spread) / 100 / 12
      let capital = Number(v.monto)
      const serie = [{ mes: 0, capital: Math.round(capital) }]
      for (let m = 1; m <= meses; m++) {
        capital = capital * (1 + inflMensual) * (1 + spreadMensual)
        serie.push({ mes: m, capital: Math.round(capital) })
      }
      const total = serie[serie.length - 1].capital
      setResultado({ tipo, total, interes: total - Number(v.monto), serie, monto: Number(v.monto) })
    } else {
      const r = calcularPlazoFijo(Number(v.monto), Number(v.tna), Number(v.dias))
      setResultado({ tipo, chartData: [
        { categoria: 'Capital USD',   monto: Number(v.monto) },
        { categoria: 'Intereses USD', monto: r.interes },
      ], ...r })
    }
  }

  const fields = tipo === 'pesos' ? FIELDS_PESOS : tipo === 'uva' ? FIELDS_UVA : FIELDS_USD
  const fmt = tipo === 'usd' ? formatUSD : formatARS

  return (
    <div className="space-y-3">
      {tipo === 'uva' && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
          <strong>Plazo Fijo UVA:</strong> Tu capital se ajusta mes a mes por la inflación (CER)
          más una pequeña tasa real positiva. Protege tu poder adquisitivo si la inflación es alta.
          Plazo mínimo: 90 días en la mayoría de los bancos. El Banco Nación ofrece desde 30 días.
        </div>
      )}

      <GlosarioSimulador titulo="Glosario: TNA, UVA y CER" terminos={GLOSARIO} />

      <SimuladorForm key={tipo} fields={fields} onCalculate={calcular} />

      {resultado && tipo === 'pesos' && tnaUsada && (
        <InflacionCheck key={tnaUsada} tna={tnaUsada} />
      )}

      {resultado && tipo !== 'uva' && (
        <SimuladorChart
          type="bar"
          data={resultado.chartData}
          xKey="categoria"
          yLabel={tipo === 'usd' ? 'Dólares (U$S)' : 'Pesos ($)'}
          dataKeys={[{ key: 'monto', name: tipo === 'usd' ? 'Monto (U$S)' : 'Monto ($)' }]}
          result={{
            label: 'Total recibido',
            value: fmt(resultado.total),
            sublabel: 'Intereses ganados',
            subvalue: fmt(resultado.interes),
          }}
          formatTooltip={v => fmt(v)}
        />
      )}

      {resultado && tipo === 'uva' && (
        <SimuladorChart
          type="area"
          data={resultado.serie}
          xKey="mes"
          xLabel="Mes"
          yLabel="Capital ($)"
          dataKeys={[{ key: 'capital', name: 'Capital ajustado ($)' }]}
          result={{
            label: 'Total recibido',
            value: formatARS(resultado.total),
            sublabel: 'Interés ganado',
            subvalue: formatARS(resultado.interes),
          }}
          formatTooltip={v => formatARS(v)}
        />
      )}

    </div>
  )
}
