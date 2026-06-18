'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { X, Check, Move } from 'lucide-react'

const FRAME = 360

interface Props {
  file: File
  onConfirm: (cropped: File) => void
  onCancel: () => void
}

export default function CropModal({ file, onConfirm, onCancel }: Props) {
  const [src, setSrc] = useState('')
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onLoad = useCallback(() => {
    const img = imgRef.current!
    const s = Math.max(FRAME / img.naturalWidth, FRAME / img.naturalHeight)
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    setNat({ w: nw, h: nh })
    setScale(s)
    setOffset({ x: (FRAME - nw * s) / 2, y: (FRAME - nh * s) / 2 })
  }, [])

  function clamp(x: number, y: number) {
    return {
      x: Math.min(0, Math.max(FRAME - nat.w * scale, x)),
      y: Math.min(0, Math.max(FRAME - nat.h * scale, y)),
    }
  }

  function startDrag(mx: number, my: number) {
    setDragging(true)
    drag.current = { mx, my, ox: offset.x, oy: offset.y }
  }

  function moveDrag(mx: number, my: number) {
    if (!dragging) return
    setOffset(clamp(drag.current.ox + mx - drag.current.mx, drag.current.oy + my - drag.current.my))
  }

  function handleConfirm() {
    if (!nat.w) return
    const img = imgRef.current!
    const srcX = -offset.x / scale
    const srcY = -offset.y / scale
    const srcSize = FRAME / scale
    const out = Math.min(900, Math.round(srcSize))
    const canvas = document.createElement('canvas')
    canvas.width = out
    canvas.height = out
    canvas.getContext('2d')!.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, out, out)
    canvas.toBlob((blob) => {
      if (!blob) return
      onConfirm(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.88)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div>
            <h3 className="font-bold text-sm" style={{ color: '#F5F5F5' }}>Ajustar encuadre</h3>
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#9CA3AF' }}>
              <Move size={11} /> Arrastra para reposicionar
            </p>
          </div>
          <button onClick={onCancel} className="p-1 hover:opacity-70 transition-opacity">
            <X size={18} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Crop frame */}
        <div className="p-4">
          <div
            style={{
              width: FRAME,
              height: FRAME,
              position: 'relative',
              overflow: 'hidden',
              cursor: dragging ? 'grabbing' : 'grab',
              borderRadius: 12,
              border: '2px solid #C0392B',
              userSelect: 'none',
              touchAction: 'none',
            }}
            onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
            onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onTouchStart={(e) => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY) }}
            onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={() => setDragging(false)}
          >
            {src && (
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                onLoad={onLoad}
                style={{
                  position: 'absolute',
                  left: offset.x,
                  top: offset.y,
                  width: nat.w * scale,
                  height: nat.h * scale,
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* Regla de tercios */}
            {[1 / 3, 2 / 3].map((f) => (
              <div key={f} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', inset: '0 0 auto', top: `${f * 100}%`, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div style={{ position: 'absolute', inset: '0 auto 0 0', left: `${f * 100}%`, width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}
          >
            <Check size={15} /> Recortar
          </button>
        </div>
      </div>
    </div>
  )
}
