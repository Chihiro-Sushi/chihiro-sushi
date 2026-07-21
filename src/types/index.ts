import { Timestamp } from 'firebase/firestore'

export interface Categoria {
  id: string
  nombre: string
  orden: number
  activa: boolean
  icono?: string
}

export interface Variante {
  nombre: string
  precioExtra: number
}

export interface MenuItem {
  id: string
  categoriaId: string
  nombre: string
  descripcion: string
  precio: number
  variantes?: Variante[]
  imagenUrl?: string
  disponible: boolean
  orden: number
  etiquetas?: string[]
}

export interface ItemCarrito {
  itemId: string
  nombre: string
  categoriaId?: string
  variante?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Pedido {
  id: string
  numeroPedido?: number
  cliente: {
    nombre: string
    telefono: string
    direccion: string
    coordenadas: { lat: number; lng: number }
  }
  items: ItemCarrito[]
  subtotal: number
  costoEnvio: number
  descuento: number
  total: number
  metodoPago: 'efectivo' | 'tarjeta'
  comisionTarjeta?: number
  pagoEfectivo?: 'exacto' | 'cambio'
  distanciaKm?: number
  surcargoClimatico?: number
  surcargoCondominio?: number
  condominio?: string
  entradaCondominio?: 'carretera_federal' | 'la_joya'
  estado: 'esperando_pago' | 'pendiente' | 'en_proceso' | 'en_camino' | 'entregado' | 'cancelado'
  stripePaymentId?: string
  notas?: string
  creadoEn: Timestamp | string
  actualizadoEn: Timestamp | string
}

export type EstadoPedido = Pedido['estado']

export interface Promocion {
  id: string
  nombre: string
  descripcion: string
  tipo: '3x2' | '2x1' | 'porcentaje' | 'fijo'
  valor?: number
  categoriaIds?: string[]
  itemIds?: string[]
  diasSemana?: number[] // 0=Dom, 1=Lun…6=Sáb. Vacío/undefined = todos los días
  activa: boolean
  fechaInicio?: Timestamp
  fechaFin?: Timestamp
}

export interface ConfiguracionSitio {
  nombreRestaurante: string
  slogan: string
  telefono: string
  horario: string
  tiempoEntrega?: string
  imagenPortada: string
  imagenesGaleria: string[]
  textoDestacado: string
  redesSociales: {
    facebook?: string
    instagram?: string
    whatsapp?: string
    tiktok?: string
  }
  tarifaEnvioBase: number
  tarifaPorKm: number
  kmMaximoEnvio: number
  tarifaClimaticaActiva?: boolean
  montoClimatico?: number
  suspensionDelivery?: boolean
}
