import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ error: 'No file' }, { status: 400 })

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) {
      return Response.json({ error: 'Cloudinary not configured' }, { status: 500 })
    }

    const body = new FormData()
    body.append('file', file)
    body.append('upload_preset', uploadPreset)
    body.append('folder', 'menu_items')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body,
    })

    const data = await res.json()
    if (!res.ok) return Response.json({ error: data.error?.message ?? 'Upload failed' }, { status: 500 })

    return Response.json({ url: data.secure_url })
  } catch (err) {
    console.error('[upload]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
