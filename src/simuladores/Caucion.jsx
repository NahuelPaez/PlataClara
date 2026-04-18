import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
import GlosarioSimulador from '../components/GlosarioSimulador'
import InflacionCheck from '../components/InflacionCheck'
import { formatARS } from '../utils/formatters'

const FIELDS = [
  { id: 'monto',    label: 'Monto',            type: 'number', unit: '$',    defaultValue: 200000, min: 10000, hint: 'Monto mínimo sugerido: $50.000' },
  { id: 'dias',     label: 'Plazo',            type: 'number', unit: 'días', defaultValue: 7,      min: 1, max: 120 },
  { id: 'tasa',     label: 'Tasa anual',       type: 'number', unit: '%',    defaultValue: 45,     min: 0.1, max: 300, hint: 'Consultá la tasa colocadora en tu broker' },
  { id: 'comision', label: 'Comisión broker',  type: 'number', unit: '%',    defaultValue: 0.1,    min: 0, max: 2, hint: 'Típicamente 0.1% del monto' },
]

const GLOSARIO = [
  { term: '🤝 ¿Qué es una caución?', def: 'Es como un "plazo fijo de la bolsa". Prestás dinero a otros participantes del mercado a cambio de una tasa acordada. Está garantizada por la bolsa y los plazos van de 1 a 120 días. Necesitás cuenta en un broker (Invertir Online, Balanz, PPI, etc.).' },
  { term: '🤝 Caución bursátil', def: 'Operación del mercado de capitales donde prestás dinero a otro participante a cambio de una tasa pactada. Está garantizada por el BYMA (Bolsas y Mercados Argentinos), lo que la hace muy segura. Es el equivalente a un plazo fijo, pero dentro de la bolsa.' },
  { term: '📈 Tasa de caución colocadora', def: 'La tasa que te pagan por prestar tu dinero. Es variable y depende de la oferta y demanda del mercado. Generalmente es más alta que la de un plazo fijo bancario porque los tomadores son participantes institucionales.' },
  { term: '🏛️ Garantía del BYMA', def: 'A diferencia de un préstamo directo, la caución está garantizada por la cámara compensadora del mercado. Aunque el tomador no pague, el BYMA cubre la obligación. Por eso el riesgo es prácticamente nulo.' },
]

export default function Caucion() {
  const [resultado, setResultado] = useState(null)
  const [tasaUsada, setTasaUsada] = useState(null)

  function calcular(v) {
    const monto     = Number(v.monto)
    const dias      = Number(v.dias)
    const tasa      = Number(v.tasa)
    const comision  = Number(v.comision)

    const interesGruto   = monto * (tasa / 100 / 365) * dias
    const comisionPesos  = monto * (comision / 100)
    const interesNeto    = interesGruto - comisionPesos

    const chartData = [
      { concepto: 'Capital',       monto: Math.round(monto) },
      { concepto: 'Ganancia neta', monto: Math.round(interesNeto) },
    ]

    setTasaUsada(tasa)
    setResultado({ interesGruto, comisionPesos, interesNeto, total: monto + interesNeto, chartData })
  }

  return (
    <div className="space-y-6">
      <GlosarioSimulador titulo="Glosario: caución, tasa y garantía" terminos={GLOSARIO} />

      <SimuladorForm fields={FIELDS} onCalculate={calcular} />

      {resultado && tasaUsada && (
        <InflacionCheck key={tasaUsada} tna={tasaUsada} />
      )}

      {resultado && (
        <>
          <SimuladorChart
            type="bar"
            data={resultado.chartData}
            xKey="concepto"
            yLabel="Pesos ($)"
            dataKeys={[{ key: 'monto', name: 'Monto ($)' }]}
            result={{
              label: 'Total recibido',
              value: formatARS(resultado.total),
              sublabel: 'Intereses ganados',
              subvalue: formatARS(resultado.interesNeto),
            }}
            formatTooltip={v => formatARS(v)}
          />
          <p className="text-xs text-slate-400 text-center">
            Comisión estimada del broker: {formatARS(resultado.comisionPesos)}. Las comisiones reales varían según el broker.
          </p>
        </>
      )}
    </div>
  )
}
