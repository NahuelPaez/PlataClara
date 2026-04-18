import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
import GlosarioSimulador from '../components/GlosarioSimulador'
import { formatARS, formatPct } from '../utils/formatters'

const FIELDS = [
  { id: 'monto',  label: 'Monto a invertir',      type: 'number', unit: '$',  defaultValue: 100000, min: 1000 },
  {
    id: 'precio',
    label: 'Paridad del bono (%)',
    type: 'number', unit: '%', defaultValue: 95, min: 1, max: 200,
    hint: 'Precio de mercado como % del Valor Nominal. Paridad = 100 significa que cotiza a la par.',
  },
  { id: 'cupon',  label: 'Cupón anual',    type: 'number', unit: '%',    defaultValue: 8,  min: 0, max: 100, hint: '% del VN que paga de interés por año' },
  { id: 'anios',  label: 'Maturity (años a vencimiento)', type: 'number', unit: 'años', defaultValue: 3, min: 1, max: 30, hint: 'Tiempo hasta que el bono vence y devuelve el capital' },
]

const GLOSARIO = [
  { term: '📜 ¿Qué son los Bonos y ONs?', def: 'Un bono es un préstamo que le hacés al Estado o a una empresa. A cambio, te pagan intereses periódicos (cupones) y te devuelven el capital al vencimiento. La TIR es el rendimiento anual efectivo considerando el precio de compra.' },
  { term: '📐 Paridad (precio del bono)', def: 'Es el precio al que cotiza el bono expresado como porcentaje de su Valor Nominal (VN).\n• Paridad = 100%: el bono cotiza "a la par" → pagás exactamente el VN.\n• Paridad < 100%: cotiza "bajo la par" → pagás menos que el VN. Podés ganar más al vencimiento.\n• Paridad > 100%: cotiza "sobre la par" → pagás más que el VN.\nEjemplo: un bono con VN $1.000 y paridad 95% se compra a $950.' },
  { term: '📅 Maturity (plazo a vencimiento)', def: 'Es la cantidad de años que faltan para que el bono venza y el emisor devuelva el capital (VN). Cuanto mayor es el maturity, mayor es la sensibilidad del bono a cambios en las tasas de interés. Bonos de corto plazo (1-3 años): menos riesgo de tasa. Bonos de largo plazo (10+ años): más potencial pero más volatilidad.' },
]

export default function Bonos() {
  const [resultado, setResultado] = useState(null)

  function calcular(v) {
    const monto = Number(v.monto)
    const precio = Number(v.precio) / 100
    const cupon = Number(v.cupon) / 100
    const anios = Number(v.anios)

    const vnComprado = monto / precio
    const cuponAnual = vnComprado * cupon
    const tirAprox = (cuponAnual + (vnComprado - monto) / anios) / ((monto + vnComprado) / 2) * 100

    const flujo = []
    for (let a = 1; a <= anios; a++) {
      const pago = a === anios ? cuponAnual + vnComprado : cuponAnual
      flujo.push({ anio: `Año ${a}`, pago: Math.round(pago) })
    }

    const totalRecibido = cuponAnual * anios + vnComprado
    setResultado({ flujo, cuponAnual, tirAprox, totalRecibido, ganancia: totalRecibido - monto })
  }

  return (
    <div className="space-y-6">
      <GlosarioSimulador titulo="Glosario: Paridad y Maturity" terminos={GLOSARIO} />

      <SimuladorForm fields={FIELDS} onCalculate={calcular} />

      {resultado && (
        <>
          <SimuladorChart
            type="bar"
            data={resultado.flujo}
            xKey="anio"
            dataKeys={[{ key: 'pago', name: 'Cobro ($)' }]}
            result={{
              label: 'TIR estimada',
              value: formatPct(resultado.tirAprox, 1),
              sublabel: 'Total cobrado',
              subvalue: formatARS(resultado.totalRecibido),
            }}
            formatTooltip={v => formatARS(v)}
          />
          <p className="text-xs text-slate-400 text-center">
            TIR calculada con fórmula de aproximación (solo educativo).
            Para análisis real, usá una calculadora de bonos profesional o consultá a tu broker.
          </p>
        </>
      )}
    </div>
  )
}
