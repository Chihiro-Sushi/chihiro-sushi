import { Resend } from 'resend'
import type { Pedido } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_ENCARGADO = process.env.NOTIFICACION_EMAIL ?? 'davidtejeda662@gmail.com'
const EMAIL_FROM = process.env.NOTIFICACION_FROM ?? 'Chihiro Sushi <onboarding@resend.dev>'

function formatearItems(items: Pedido['items']): string {
  return items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #2a2a2a;">${i.cantidad}x ${i.nombre}${i.variante ? ` (${i.variante})` : ''}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #2a2a2a;text-align:right;">$${i.subtotal.toFixed(2)}</td>
        </tr>`
    )
    .join('')
}

export async function enviarNotificacionPedido(pedido: Pedido): Promise<void> {
  const metodoPagoLabel = pedido.metodoPago === 'tarjeta' ? '💳 Tarjeta' : '💵 Efectivo'

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>Nuevo Pedido</title></head>
    <body style="font-family:sans-serif;background:#0f0f0f;color:#f5f5f5;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #c0392b;">

        <div style="background:#c0392b;padding:20px 24px;">
          <h1 style="margin:0;font-size:22px;color:#fff;">🍣 Nuevo Pedido — Chihiro Sushi</h1>
          <p style="margin:4px 0 0;color:#ffd0cc;font-size:14px;">
            ${new Date().toLocaleString('es-MX', { timeZone: 'America/Cancun' })}
          </p>
        </div>

        <div style="padding:24px;">
          <h2 style="color:#c0392b;font-size:15px;text-transform:uppercase;letter-spacing:1px;margin-top:0;">
            Datos del cliente
          </h2>
          <p style="margin:4px 0;"><strong>Nombre:</strong> ${pedido.cliente.nombre}</p>
          <p style="margin:4px 0;"><strong>Teléfono:</strong> ${pedido.cliente.telefono}</p>
          <p style="margin:4px 0;"><strong>Dirección:</strong> ${pedido.cliente.direccion}</p>
          <p style="margin:8px 0;">
            <a href="https://www.google.com/maps?q=${pedido.cliente.coordenadas.lat},${pedido.cliente.coordenadas.lng}"
              style="display:inline-block;background:#c0392b;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;">
              📍 Ver ubicación en Maps
            </a>
          </p>

          <h2 style="color:#c0392b;font-size:15px;text-transform:uppercase;letter-spacing:1px;margin-top:24px;">
            Resumen del pedido
          </h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#2a2a2a;">
                <th style="padding:8px 12px;text-align:left;">Producto</th>
                <th style="padding:8px 12px;text-align:right;">Precio</th>
              </tr>
            </thead>
            <tbody>${formatearItems(pedido.items)}</tbody>
          </table>

          <table style="width:100%;margin-top:16px;font-size:14px;">
            <tr><td>Subtotal</td><td style="text-align:right;">$${pedido.subtotal.toFixed(2)}</td></tr>
            ${pedido.descuento > 0 ? `<tr><td style="color:#2ecc71;">Descuento</td><td style="text-align:right;color:#2ecc71;">-$${pedido.descuento.toFixed(2)}</td></tr>` : ''}
            <tr><td>Envío</td><td style="text-align:right;">$${pedido.costoEnvio.toFixed(2)}</td></tr>
            <tr style="font-size:18px;font-weight:bold;color:#c0392b;">
              <td>TOTAL</td>
              <td style="text-align:right;">$${pedido.total.toFixed(2)}</td>
            </tr>
          </table>

          <div style="margin-top:16px;padding:12px;background:#2a2a2a;border-radius:8px;">
            <strong>Método de pago:</strong> ${metodoPagoLabel}
            ${pedido.notas ? `<br><strong>Notas:</strong> ${pedido.notas}` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: EMAIL_FROM,
    to: EMAIL_ENCARGADO,
    subject: `🍣 Nuevo pedido — $${pedido.total.toFixed(2)} — ${pedido.cliente.nombre}`,
    html,
  })
}
