'use client'

import { usePathname } from 'next/navigation'
import { useAutoReloadOnDeploy } from '@/hooks/useAutoReloadOnDeploy'

export default function AutoReload() {
  const pathname = usePathname()

  // En /checkout el cliente puede tener nombre, teléfono, dirección y notas
  // ya escritos — recargar ahí le borraría el formulario. /admin tiene su
  // propia verificación de versión, para no duplicar el polling.
  const pausado = pathname === '/checkout' || pathname.startsWith('/admin')

  useAutoReloadOnDeploy(pausado)
  return null
}
