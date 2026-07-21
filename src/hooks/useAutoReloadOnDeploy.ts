'use client'

import { useEffect } from 'react'

export function useAutoReloadOnDeploy(pausado = false) {
  useEffect(() => {
    if (pausado) return

    let versionInicial: string | null = null

    async function verificarVersion() {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        const { version } = await res.json()
        if (versionInicial === null) {
          versionInicial = version
        } else if (version !== versionInicial) {
          window.location.reload()
        }
      } catch {
        // sin conexión momentánea, se reintenta en el próximo ciclo
      }
    }

    verificarVersion()
    const intervalo = setInterval(verificarVersion, 60000)
    return () => clearInterval(intervalo)
  }, [pausado])
}
