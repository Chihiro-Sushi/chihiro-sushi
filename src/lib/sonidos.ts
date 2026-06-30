export type SonidoId = 'ding-dong' | 'campana' | 'ascendente' | 'triple' | 'alerta' | 'silencio'

export interface Sonido {
  id: SonidoId
  nombre: string
  emoji: string
  tocar: (ctx: AudioContext) => void
}

function nota(
  ctx: AudioContext,
  freq: number,
  inicio: number,
  duracion: number,
  volumen = 0.35,
  tipo: OscillatorType = 'sine',
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = tipo
  const now = ctx.currentTime
  osc.frequency.setValueAtTime(freq, now + inicio)
  gain.gain.setValueAtTime(0, now + inicio)
  gain.gain.linearRampToValueAtTime(volumen, now + inicio + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, now + inicio + duracion)
  osc.start(now + inicio)
  osc.stop(now + inicio + duracion)
}

export const SONIDOS: Sonido[] = [
  {
    id: 'ding-dong',
    nombre: 'Ding-dong',
    emoji: '🔔',
    tocar: (ctx) => {
      nota(ctx, 880, 0, 0.45)
      nota(ctx, 587, 0.28, 0.55)
    },
  },
  {
    id: 'campana',
    nombre: 'Campana',
    emoji: '🎵',
    tocar: (ctx) => {
      nota(ctx, 1046, 0, 1.4, 0.28)
      nota(ctx, 1318, 0.05, 0.9, 0.1)
    },
  },
  {
    id: 'ascendente',
    nombre: 'Ascendente',
    emoji: '📈',
    tocar: (ctx) => {
      nota(ctx, 523, 0, 0.22)
      nota(ctx, 659, 0.17, 0.22)
      nota(ctx, 784, 0.34, 0.42)
    },
  },
  {
    id: 'triple',
    nombre: 'Triple',
    emoji: '✨',
    tocar: (ctx) => {
      nota(ctx, 880, 0, 0.13)
      nota(ctx, 1046, 0.17, 0.13)
      nota(ctx, 1318, 0.34, 0.25)
    },
  },
  {
    id: 'alerta',
    nombre: 'Alerta',
    emoji: '⚡',
    tocar: (ctx) => {
      nota(ctx, 880, 0, 0.1, 0.4)
      nota(ctx, 880, 0.15, 0.1, 0.4)
    },
  },
  {
    id: 'silencio',
    nombre: 'Sin sonido',
    emoji: '🔇',
    tocar: () => {},
  },
]

export const SONIDO_DEFAULT: SonidoId = 'ding-dong'
export const LS_KEY = 'chihiro_sonido_notif'

export function getSonidoActual(): Sonido {
  if (typeof window === 'undefined') return SONIDOS[0]
  const id = (localStorage.getItem(LS_KEY) ?? SONIDO_DEFAULT) as SonidoId
  return SONIDOS.find((s) => s.id === id) ?? SONIDOS[0]
}
