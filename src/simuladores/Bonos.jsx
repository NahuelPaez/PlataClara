import { useState } from 'react'
import SimuladorForm from '../components/SimuladorForm'
import SimuladorChart from '../components/SimuladorChart'
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

export default function Bonos() {
  const [resultado, setResultado] = useState(null)
  const [showGlosario, setShowGlosario] = useState(false)

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
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
        <strong>Bonos y ONs:</strong> Un bono es un préstamo que le hacés al Estado o a una empresa.
        A cambio, te pagan intereses periódicos (cupones) y te devuelven el capital al vencimiento.
        La <strong>TIR</strong> es el rendimiento anual efectivo considerando el precio de compra.
      </div>

      {/* Glosario desplegable */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGlosario(g => !g)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
        >
          <span>📖 Glosario: Paridad y Maturity</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${showGlosario ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showGlosario && (
          <div className="px-4 py-4 bg-white space-y-3 text-sm text-slate-600 border-t border-slate-100">
            <div>
              <p className="font-semibold text-slate-700 mb-1">📐 Paridad (precio del bono)</p>
              <p>
                Es el precio al que cotiza el bono expresado como porcentaje de su Valor Nominal (VN).
                <br />
                • <strong>Paridad = 100%</strong>: el bono cotiza "a la par" → pagás exactamente el VN.
                <br />
                • <strong>Paridad &lt; 100%</strong>: cotiza "bajo la par" → pagás menos que el VN. Podés ganar más al vencimiento.
                <br />
                • <strong>Paridad &gt; 100%</strong>: cotiza "sobre la par" → pagás más que el VN.
                <br />
                Ejemplo: un bono con VN $1.000 y paridad 95% se compra a $950.
              </p>
            </div>
            <div className="border-t border-slate-50 pt-3">
              <p className="font-semibold text-slate-700 mb-1">📅 Maturity (plazo a vencimiento)</p>
              <p>
                Es la cantidad de años que faltan para que el bono venza y el emisor devuelva el capital (VN).
                Cuanto mayor es el maturity, mayor es la sensibilidad del bono a cambios en las tasas de interés.
                <br />
                Bonos de <strong>corto plazo</strong> (1-3 años): menos riesgo de tasa.
                Bonos de <strong>largo plazo</strong> (10+ años): más potencial pero más volatilidad.
              </p>
            </div>
          </div>
        )}
      </div>

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
