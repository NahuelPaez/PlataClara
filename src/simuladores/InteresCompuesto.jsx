import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
import InflacionCheck from '../components/InflacionCheck'
import GlosarioSimulador from '../components/GlosarioSimulador'
import { calcularInteresCompuesto, formatARS, formatPct } from '../utils/formatters'

const GLOSARIO = [
  { term: '📈 El poder del interés compuesto', def: 'Al reinvertir los intereses período a período, tu dinero crece de forma exponencial. A mayor plazo, mayor es el efecto. Este simulador muestra cuánto de tu capital final viene de aportes propios y cuánto de los intereses generados.' },
  { term: '🔄 Capitalización', def: 'Es el proceso de sumar los intereses ganados al capital para que en el siguiente período también generen intereses. Cuanto más frecuente es la capitalización, mayor es el rendimiento final.' },
]

const FIELDS_BASE = [
  { id: 'montoInicial',  label: 'Capital inicial',       type: 'number', unit: '$',   defaultValue: 100000, min: 0 },
  { id: 'aporteMensual', label: 'Aporte mensual',         type: 'number', unit: '$',   defaultValue: 20000,  min: 0 },
  { id: 'tna',           label: 'TNA esperada',           type: 'number', unit: '%',   defaultValue: 40,     min: 0.1, max: 300 },
]

export default function InteresCompuesto() {
  const [resultado, setResultado] = useState(null)
  const [unidad, setUnidad] = useState('años')
  const [tnaUsada, setTnaUsada] = useState(null)

  const fieldHorizonte = {
    id: 'horizonte',
    label: 'Horizonte de inversión',
    type: 'number',
    defaultValue: unidad === 'años' ? 5 : 6,
    min: 1,
    max: unidad === 'años' ? 30 : 360,
    unitSelect: {
      options: ['años', 'meses'],
      value: unidad,
      onChange: (u) => { setUnidad(u); setResultado(null) },
    },
  }

  const fields = [...FIELDS_BASE, fieldHorizonte]

  function calcular(v) {
    const pv  = Number(v.montoInicial)
    const pmt = Number(v.aporteMensual)
    const tna = Number(v.tna)

    setTnaUsada(tna)
    if (unidad === 'años') {
      setResultado({ ...calcularInteresCompuesto(pv, pmt, tna, Number(v.horizonte)), xKey: 'anio', xLabel: 'Año' })
    } else {
      // Calcular mes a mes
      const meses = Number(v.horizonte)
      const r = tna / 100 / 12
      let saldo = pv
      let totalAportado = pv
      const serie = []
      for (let m = 0; m <= meses; m++) {
        serie.push({ mes: m, aportado: Math.round(totalAportado), intereses: Math.round(saldo - totalAportado), total: Math.round(saldo) })
        if (m < meses) { saldo = saldo * (1 + r) + pmt; totalAportado += pmt }
      }
      setResultado({ totalAportado, totalIntereses: saldo - totalAportado, total: saldo, serie, xKey: 'mes', xLabel: 'Mes' })
    }
  }

  return (
    <div className="space-y-6">
      <GlosarioSimulador titulo="Glosario" terminos={GLOSARIO} />

      <SimuladorForm key={unidad} fields={fields} onCalculate={calcular} />

      {resultado && (
        <>
          <InflacionCheck key={tnaUsada} tna={tnaUsada} />

          <SimuladorChart
            type="area"
            data={resultado.serie}
            xKey={resultado.xKey}
            xLabel={resultado.xLabel}
            dataKeys={[
              { key: 'aportado',  name: 'Aportado ($)',  color: '#cbd5e1' },
              { key: 'intereses', name: 'Intereses ($)', color: '#10b981' },
            ]}
            result={{
              label: 'Total final',
              value: formatARS(resultado.total),
              sublabel: 'Intereses generados',
              subvalue: formatARS(resultado.totalIntereses),
            }}
            formatTooltip={v => formatARS(v)}
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center py-3">
              <p className="text-xs text-slate-500 mb-1">Total aportado</p>
              <p className="text-base font-bold text-slate-700">{formatARS(resultado.totalAportado)}</p>
            </div>
            <div className="card text-center py-3 bg-emerald-50">
              <p className="text-xs text-slate-500 mb-1">Intereses generados</p>
              <p className="text-base font-bold text-emerald-700">{formatARS(resultado.totalIntereses)}</p>
            </div>
            <div className="card text-center py-3 bg-primary-50">
              <p className="text-xs text-slate-500 mb-1">% de intereses</p>
              <p className="text-base font-bold text-primary-700">
                {formatPct(resultado.totalIntereses / resultado.total * 100)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
