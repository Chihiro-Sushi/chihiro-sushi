import type { Metadata } from 'next'
import './globals.css'
import { CarritoProvider } from '@/context/CarritoContext'
import { ToastProvider } from '@/context/ToastContext'
import Toast from '@/components/ui/Toast'
import AutoReload from '@/components/AutoReload'

export const metadata: Metadata = {
  title: 'Chihiro Sushi — ¡Un viaje de sabor en cada bocado!',
  description: 'Cocina Japonesa Fusión con servicio a domicilio en todo Playa del Carmen. Sushi, rolls, ramen, poke bowls y más.',
  keywords: ['sushi', 'japonés', 'delivery', 'Playa del Carmen', 'Chihiro'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CarritoProvider>
          <ToastProvider>
            {children}
            <Toast />
            <AutoReload />
          </ToastProvider>
        </CarritoProvider>
      </body>
    </html>
  )
}
