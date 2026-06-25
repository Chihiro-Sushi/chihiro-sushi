import { Phone, Clock, MapPin } from 'lucide-react'
import type { ConfiguracionSitio } from '@/types'

interface Props {
  config?: Pick<ConfiguracionSitio, 'slogan' | 'telefono' | 'horario' | 'redesSociales'>
}

export default function Footer({ config }: Props) {
  const slogan = config?.slogan ?? '¡Un viaje de sabor en cada bocado!'
  const telefono = config?.telefono ?? '(984) 313 9064'
  const horario = config?.horario ?? 'Lun–Dom 13:00–23:00 hrs'
  const whatsapp = config?.redesSociales?.whatsapp ?? '9843139064'
  const instagram = config?.redesSociales?.instagram ?? 'Sushi_Chihiro'
  const facebook = config?.redesSociales?.facebook ?? 'Chihiro Sushi'

  return (
    <footer id="contacto" className="bg-negro border-t border-rojo/20 pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            <h3 className="text-rojo font-bold text-lg mb-4">CHIHIRO SUSHI</h3>
            <p className="text-gris text-sm leading-relaxed">
              {slogan}
              <br />Cocina Japonesa Fusión
            </p>
            <p className="text-gris/60 text-xs mt-3 italic">
              Solo disponible en delivery.
            </p>
          </div>

          <div>
            <h3 className="text-blanco font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-gris">
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-rojo shrink-0" />
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="hover:text-rojo transition-colors">{telefono}</a>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={15} className="text-rojo shrink-0" />
                {horario}
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={15} className="text-rojo shrink-0" />
                Servicio a todo Playa del Carmen
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-blanco font-semibold mb-4">Síguenos</h3>
            <ul className="space-y-2 text-sm text-gris">
              <li>
                <a href="https://www.facebook.com/profile.php?id=61583605506197" target="_blank" rel="noopener noreferrer"
                  className="hover:text-rojo transition-colors">📘 {facebook}</a>
              </li>
              <li>
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer"
                  className="hover:text-rojo transition-colors">📸 {instagram}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blanco/10 pt-6 text-center text-gris/40 text-xs">
          © {new Date().getFullYear()} Chihiro Sushi — Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
