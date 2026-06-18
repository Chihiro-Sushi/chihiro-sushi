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

function clampOff(x: number, y: number, s: number, nw: number, nh: number) {
  return {
    x: Math.min(0, Math.max(FRAME - nw * s, x)),
    y: Math.min(0, Math.max(FRAME - nh * s, y)),
  }
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

  // Refs en sync con el estado — los event handlers leen de aquí para evitar closures obsoletos
  const draggingRef = useRef(false)
  const zoomRef = useRef(1)
  const offsetRef = useRef({ x: 0, y: 0 })
  const natRef = useRef({ w: 0, h: 0 })
  const baseScaleRef = useRef(1)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { offsetRef.current = offset }, [offset])
  useEffect(() => { natRef.current = nat }, [nat])
  useEffect(() => { baseScaleRef.current = baseScale }, [baseScale])

  // Helpers para sincronizar ref + estado juntos
  function setZoomSync(z: number) { zoomRef.current = z; setZoom(z) }
  function setOffsetSync(o: { x: number; y: number }) { offsetRef.current = o; setOffset(o) }

  // Drag ref
  const drag = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  // Pinch ref
  const pinch = useRef({ dist: 0, midX: 0, midY: 0, ox: 0, oy: 0, z: 1 })

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onImgLoad = useCallback(() => {
    const img = imgRef.current!
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const s = Math.max(FRAME / nw, FRAME / nh)
    const initOffset = { x: (FRAME - nw * s) / 2, y: (FRAME - nh * s) / 2 }
    setNat({ w: nw, h: nh }); natRef.current = { w: nw, h: nh }
    setBaseScale(s); baseScaleRef.current = s
    setZoomSync(1)
    setOffsetSync(initOffset)
  }, [])

  // ── Todos los event listeners en un solo useEffect con passive:false ──
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current as HTMLDivElement

    // Mouse
    function onMouseDown(e: MouseEvent) {
      e.preventDefault()
      draggingRef.current = true
      setDragging(true)
      drag.current = { mx: e.clientX, my: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y }
    }
    function onMouseMove(e: MouseEvent) {
      if (!draggingRef.current) return
      const s = baseScaleRef.current * zoomRef.current
      const { w, h } = natRef.current
      setOffsetSync(clampOff(
        drag.current.ox + e.clientX - drag.current.mx,
        drag.current.oy + e.clientY - drag.current.my,
        s, w, h
      ))
    }
    function onMouseUp() {
      draggingRef.current = false
      setDragging(false)
    }

    // Wheel
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const ax = e.clientX - rect.left
      const ay = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      const z = zoomRef.current
      const o = offsetRef.current
      const bs = baseScaleRef.current
      const { w, h } = natRef.current
      const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor))
      const curS = bs * z
      const newS = bs * newZ
      const imgX = (ax - o.x) / curS
      const imgY = (ay - o.y) / curS
      setZoomSync(newZ)
      setOffsetSync(clampOff(ax - imgX * newS, ay - imgY * newS, newS, w, h))
    }

    // Touch
    function getTwoTouchDist(t: TouchList) {
      return Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY)
    }
    function getTwoTouchMid(t: TouchList, rect: DOMRect) {
      return {
        x: (t[0].clientX + t[1].clientX) / 2 - rect.left,
        y: (t[0].clientY + t[1].clientY) / 2 - rect.top,
      }
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 1) {
        draggingRef.current = true
        setDragging(true)
        drag.current = {
          mx: e.touches[0].clientX,
          my: e.touches[0].clientY,
          ox: offsetRef.current.x,
          oy: offsetRef.current.y,
        }
      } else if (e.touches.length === 2) {
        draggingRef.current = false
        setDragging(false)
        const rect = el.getBoundingClientRect()
        const mid = getTwoTouchMid(e.touches, rect)
        pinch.current = {
          dist: getTwoTouchDist(e.touches),
          midX: mid.x,
          midY: mid.y,
          ox: offsetRef.current.x,
          oy: offsetRef.current.y,
          z: zoomRef.current,
        }
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 1 && draggingRef.current) {
        const s = baseScaleRef.current * zoomRef.current
        const { w, h } = natRef.current
        setOffsetSync(clampOff(
          drag.current.ox + e.touches[0].clientX - drag.current.mx,
          drag.current.oy + e.touches[0].clientY - drag.current.my,
          s, w, h
        ))
      } else if (e.touches.length === 2) {
        const rect = el.getBoundingClientRect()
        const { w, h } = natRef.current
        const bs = baseScaleRef.current
        const newDist = getTwoTouchDist(e.touches)
        const newMid = getTwoTouchMid(e.touches, rect)
        const { dist, midX, midY, ox, oy, z } = pinch.current
        const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (newDist / dist)))
        const oldS = bs * z
        const newS = bs * newZ
        const imgX = (midX - ox) / oldS
        const imgY = (midY - oy) / oldS
        setZoomSync(newZ)
        setOffsetSync(clampOff(newMid.x - imgX * newS, newMid.y - imgY * newS, newS, w, h))
      }
    }

    function onTouchEnd() {
      draggingRef.current = false
      setDragging(false)
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  // ── Botones de zoom ──
  function zoomStep(dir: 1 | -1) {
    const z = zoomRef.current
    const o = offsetRef.current
    const bs = baseScaleRef.current
    const { w, h } = natRef.current
    const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (dir > 0 ? 1.25 : 1 / 1.25)))
    const curS = bs * z
    const newS = bs * newZ
    const ax = FRAME / 2
    const ay = FRAME / 2
    const imgX = (ax - o.x) / curS
    const imgY = (ay - o.y) / curS
    setZoomSync(newZ)
    setOffsetSync(clampOff(ax - imgX * newS, ay - imgY * newS, newS, w, h))
  }

  // ── Export ──
  function handleConfirm() {
    if (!natRef.current.w) return
    const img = imgRef.current!
    const s = baseScaleRef.current * zoomRef.current
    const o = offsetRef.current
    const srcX = -o.x / s
    const srcY = -o.y / s
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
              <Move size={11} /> Arrastra · Rueda del ratón · Pellizca en móvil
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
          >
            {src && (
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                onLoad={onImgLoad}
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
