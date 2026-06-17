import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const result = await resend.emails.send({
      from: 'Chihiro Sushi <onboarding@resend.dev>',
      to: process.env.NOTIFICACION_EMAIL!,
      subject: 'Test email — Chihiro Sushi',
      html: '<p>Si ves esto, Resend está funcionando correctamente.</p>',
    })
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
