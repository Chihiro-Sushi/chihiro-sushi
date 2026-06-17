import { NextRequest } from 'next/server'
import { getAdminStorage } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `menu_items/${Date.now()}_${file.name}`

    const bucket = getAdminStorage().bucket()
    const fileRef = bucket.file(fileName)

    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    })

    await fileRef.makePublic()

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
    return Response.json({ url: publicUrl })
  } catch (err) {
    console.error('[upload]', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
