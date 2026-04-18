import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
import GlosarioSimulador from '../components/GlosarioSimulador'
import InflacionCheck from '../components/InflacionCheck'
import { calcularCuentaRemunerada, formatARS } from '../utils/formatters'

const FIELDS = [
  { id: 'monto', label: 'Monto inicial', type: 'number', unit: '$', defaultValue: 100000, min: 100, hint: 'Cuánto tenés en la cuenta' },
  { id: 'dias',  label: 'Días',           type: 'number', unit: 'días', defaultValue: 30, min: 1, max: 365 },
  { id: 'tna',   label: 'TNA',            type: 'number', unit: '%',    defaultValue: 42, min: 0.1, max: 200, hint: 'Consultá la tasa de tu billetera' },
]

const GLOSARIO = [
  { term: '💡 ¿Cómo funciona?', def: 'Una cuenta remunerada acredita intereses diariamente sobre el saldo disponible. No requiere inmovilizar el dinero — podés retirarlo cuando quieras.' },
  { term: '📊 TNA (Tasa Nominal Anual)', def: 'Es la tasa de interés expresada en términos anuales sin considerar la capitalización. Por ejemplo, una TNA del 42% significa que si dejás el dinero un año completo ganás aproximadamente un 42% bruto sobre tu capital.' },
  { term: '📈 TEA (Tasa Efectiva Anual)', def: 'Es la tasa real que ganás en el año, considerando que los intereses se acreditan y reinvierten día a día. Siempre es mayor que la TNA cuando hay capitalización diaria.' },
  { term: '🔄 Acreditación diaria', def: 'Las cuentas remuneradas acreditan los intereses todos los días sobre el saldo disponible. Esto significa que los intereses del día anterior también generan intereses al día siguiente (capitalización compuesta).' },
]

export default function CuentaRemunerada() {
  const [resultado, setResultado] = useState(null)
  const [tnaUsada, setTnaUsada] = useState(null)

  function calcular(v) {
    const r = calcularCuentaRemunerada(Number(v.monto), Number(v.tna), Number(v.dias))
    const step = Math.max(1, Math.floor(r.serie.length / 40))
    const serie = r.serie.filter((_, i) => i % step === 0 || i === r.serie.length - 1)
    setTnaUsada(Number(v.tna))
    setResultado({ ...r, serie, v })
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
          type="area"
          data={resultado.serie}
          xKey="dia"
          xLabel="Día"
          yLabel="Pesos ($)"
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
