'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { X, Check, Move, ZoomIn, ZoomOut } from 'lucide-react'

const FRAME = 360
const MIN_ZOOM = 1
const MAX_ZOOM = 5

interface Props {
  file: File
  onConfirm: (cropped: File) => void
  onCancel: () => void
}

export default function CropModal({ file, onConfirm, onCancel }: Props) {
  const [src, setSrc] = useState('')
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const pinch = useRef({ dist: 0, midX: 0, midY: 0, ox: 0, oy: 0, z: 1 })

  // Mirrors for non-passive wheel handler (avoids stale closure)
  const zoomRef = useRef(zoom)
  const offsetRef = useRef(offset)
  const natRef = useRef(nat)
  const baseScaleRef = useRef(baseScale)
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { offsetRef.current = offset }, [offset])
  useEffect(() => { natRef.current = nat }, [nat])
  useEffect(() => { baseScaleRef.current = baseScale }, [baseScale])

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Non-passive wheel listener (React wheel events are passive by default)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const ax = e.clientX - rect.left
      const ay = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      const z = zoomRef.current
      const o = offsetRef.current
      const bs = baseScaleRef.current
      const n = natRef.current
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor))
      const curS = bs * z
      const newS = bs * newZoom
      const imgX = (ax - o.x) / curS
      const imgY = (ay - o.y) / curS
      setZoom(newZoom)
      setOffset({
        x: Math.min(0, Math.max(FRAME - n.w * newS, ax - imgX * newS)),
        y: Math.min(0, Math.max(FRAME - n.h * newS, ay - imgY * newS)),
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const clamp = useCallback((x: number, y: number, s: number, nw: number, nh: number) => ({
    x: Math.min(0, Math.max(FRAME - nw * s, x)),
    y: Math.min(0, Math.max(FRAME - nh * s, y)),
  }), [])

  const onLoad = useCallback(() => {
    const img = imgRef.current!
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const s = Math.max(FRAME / nw, FRAME / nh)
    setNat({ w: nw, h: nh })
    setBaseScale(s)
    setZoom(1)
    setOffset({ x: (FRAME - nw * s) / 2, y: (FRAME - nh * s) / 2 })
  }, [])

  // ── Drag ──
  function startDrag(mx: number, my: number) {
    setDragging(true)
    drag.current = { mx, my, ox: offset.x, oy: offset.y }
  }

  function moveDrag(mx: number, my: number) {
    if (!dragging) return
    const s = baseScale * zoom
    setOffset(clamp(
      drag.current.ox + mx - drag.current.mx,
      drag.current.oy + my - drag.current.my,
      s, nat.w, nat.h
    ))
  }

  // ── Zoom buttons ──
  function zoomStep(dir: 1 | -1) {
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * (dir > 0 ? 1.25 : 1 / 1.25)))
    const curS = baseScale * zoom
    const newS = baseScale * newZoom
    const ax = FRAME / 2
    const ay = FRAME / 2
    const imgX = (ax - offset.x) / curS
    const imgY = (ay - offset.y) / curS
    setZoom(newZoom)
    setOffset(clamp(ax - imgX * newS, ay - imgY * newS, newS, nat.w, nat.h))
  }

  // ── Pinch (touch) ──
  function dist2(t: TouchList) {
    return Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY)
  }

  function mid2(t: TouchList, rect: DOMRect) {
    return {
      x: (t[0].clientX + t[1].clientX) / 2 - rect.left,
      y: (t[0].clientY + t[1].clientY) / 2 - rect.top,
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2) {
      setDragging(false)
      const rect = containerRef.current!.getBoundingClientRect()
      const m = mid2(e.touches, rect)
      pinch.current = { dist: dist2(e.touches), midX: m.x, midY: m.y, ox: offset.x, oy: offset.y, z: zoom }
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1 && dragging) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2) {
      const rect = containerRef.current!.getBoundingClientRect()
      const newDist = dist2(e.touches)
      const newMid = mid2(e.touches, rect)
      const factor = newDist / pinch.current.dist
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinch.current.z * factor))
      const oldS = baseScale * pinch.current.z
      const newS = baseScale * newZoom
      const imgX = (pinch.current.midX - pinch.current.ox) / oldS
      const imgY = (pinch.current.midY - pinch.current.oy) / oldS
      setZoom(newZoom)
      setOffset(clamp(newMid.x - imgX * newS, newMid.y - imgY * newS, newS, nat.w, nat.h))
    }
  }

  // ── Export ──
  function handleConfirm() {
    if (!nat.w) return
    const img = imgRef.current!
    const s = baseScale * zoom
    const srcX = -offset.x / s
    const srcY = -offset.y / s
    const srcSize = FRAME / s
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
              <Move size={11} /> Arrastra · Rueda del ratón o pellizca para zoom
            </p>
          </div>
          <button onClick={onCancel} className="p-1 hover:opacity-70 transition-opacity">
            <X size={18} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Frame */}
        <div className="p-4 flex flex-col items-center gap-3">
          <div
            ref={containerRef}
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
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
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
                  width: nat.w * baseScale * zoom,
                  height: nat.h * baseScale * zoom,
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* Regla de tercios */}
            {[1 / 3, 2 / 3].map((f) => (
              <div key={f} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: `${f * 100}%`, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${f * 100}%`, width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </div>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => zoomStep(-1)}
              disabled={zoom <= MIN_ZOOM}
              className="p-2 rounded-xl transition-all hover:opacity-80 disabled:opacity-30"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <ZoomOut size={16} style={{ color: '#F5F5F5' }} />
            </button>
            <span className="text-xs font-mono w-12 text-center" style={{ color: '#9CA3AF' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => zoomStep(1)}
              disabled={zoom >= MAX_ZOOM}
              className="p-2 rounded-xl transition-all hover:opacity-80 disabled:opacity-30"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <ZoomIn size={16} style={{ color: '#F5F5F5' }} />
            </button>
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
