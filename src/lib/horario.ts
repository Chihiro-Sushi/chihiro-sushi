const ZONA_NEGOCIO = 'America/Cancun'

// Hora actual (0-23) en la zona horaria del negocio, sin importar dónde corra
// el código (servidor Vercel en UTC, o navegador del cliente en cualquier huso).
export function horaActualNegocio(): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_NEGOCIO,
    hourCycle: 'h23',
    hour: 'numeric',
  })
  return parseInt(formatter.format(new Date()), 10)
}

// true si hoy es miércoles en la zona horaria del negocio (día sin servicio a domicilio)
export function esMiercolesNegocio(): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_NEGOCIO,
    weekday: 'short',
  })
  return formatter.format(new Date()) === 'Wed'
}
