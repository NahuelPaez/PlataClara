import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
import GlosarioSimulador from '../components/GlosarioSimulador'
import InflacionCheck from '../components/InflacionCheck'
import { calcularFCI, formatARS } from '../utils/formatters'

const FIELDS = [
  { id: 'monto', label: 'Monto inicial', type: 'number', unit: '$',     defaultValue: 100000, min: 100 },
  { id: 'meses', label: 'Horizonte',     type: 'number', unit: 'meses', defaultValue: 6,      min: 1, max: 60 },
  { id: 'tna',   label: 'TNA estimada',  type: 'number', unit: '%',     defaultValue: 43,     min: 0.1, max: 200, hint: 'Consultá la TNA del fondo en el sitio del broker' },
]

const GLOSARIO = [
  { term: '🏦 ¿Qué es un FCI Money Market?', def: 'Los fondos money market invierten en instrumentos de muy corto plazo (plazos fijos, cauciones, letras). Tienen liquidez en T+0 o T+1 y suelen rendir un poco más que una cuenta remunerada. La tasa varía según el mercado.' },
  { term: '🏦 FCI Money Market', def: 'Fondo Común de Inversión que invierte en instrumentos de muy corto plazo: plazos fijos, cauciones bursátiles y letras del Tesoro. Son los FCI de menor riesgo y mayor liquidez.' },
  { term: '⚡ Liquidez T+0 / T+1', def: 'T+0 significa que podés rescatar tu inversión y tener el dinero disponible el mismo día. T+1 significa al día hábil siguiente. Los FCI money market suelen ofrecer una de estas dos opciones según el fondo.' },
  { term: '📄 Cuotapartes', def: 'Es la unidad de medida de tu participación en el fondo. Cuando invertís, comprás cuotapartes a un precio (valor de cuotaparte). Cada día ese valor sube según el rendimiento del fondo.' },
]

export default function FCI() {
  const [resultado, setResultado] = useState(null)
  const [tnaUsada, setTnaUsada] = useState(null)

  function calcular(v) {
    const r = calcularFCI(Number(v.monto), Number(v.tna), Number(v.meses))
    setTnaUsada(Number(v.tna))
    setResultado(r)
  }

  return (
    <div className="space-y-6">
      <GlosarioSimulador titulo="Glosario" terminos={GLOSARIO} />

      <SimuladorForm fields={FIELDS} onCalculate={calcular} />

      {resultado && tnaUsada && (
        <InflacionCheck key={tnaUsada} tna={tnaUsada} />
      )}

      {resultado && (
        <SimuladorChart
          type="line"
          data={resultado.serie}
          xKey="mes"
          xLabel="Mes"
          yLabel="Saldo ($)"
          dataKeys={[{ key: 'saldo', name: 'Saldo ($)' }]}
          result={{
            label: 'Total recibido',
            value: formatARS(resultado.total),
            sublabel: 'Intereses ganados',
            subvalue: formatARS(resultado.interes),
          }}
          formatTooltip={v => formatARS(v)}
        />
      )}
    </div>
  )
}
