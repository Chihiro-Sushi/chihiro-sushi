'use client'
import { useState, useEffect } from 'react'
import type { ConfiguracionSitio } from '@/types'

const DEFECTO: ConfiguracionSitio = {
  nombreRestaurante: 'Chihiro Sushi',
  slogan: '¡Un viaje de sabor en cada bocado!',
  telefono: '(984) 313 9064',
  horario: 'Lun–Dom 13:00–23:00 hrs',
  tiempoEntrega: '45-50 min',
  imagenPortada: '',
  imagenesGaleria: [],
  textoDestacado: '🎉 3×2 todos los días — Sopas, Rollos, Yakimeshis, Pastas y Kushiages',
  redesSociales: { facebook: 'Chihiro Sushi', instagram: 'Sushi_Chihiro', whatsapp: '9843139064', tiktok: '' },
  tarifaEnvioBase: 30,
  tarifaPorKm: 10,
  kmMaximoEnvio: 15,
  tarifaClimaticaActiva: false,
  montoClimatico: 10,
  suspensionDelivery: false,
}

export function useConfiguracion() {
  const [config, setConfig] = useState<ConfiguracionSitio>(DEFECTO)

  useEffect(() => {
    fetch('/api/configuracion')
      .then((r) => r.json())
      .then((data) => setConfig({ ...DEFECTO, ...data }))
      .catch(() => {})
  }, [])

  return config
}
